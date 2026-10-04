(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EvidenceAtlasCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const LIMITS = Object.freeze({
    documents: 60,
    documentChars: 120000,
    totalChars: 1200000,
    paragraphs: 8000,
    evidence: 1000,
    queryChars: 500,
    fileBytes: 2000000,
    backupBytes: 8000000,
  });
  const RELATIONS = Object.freeze([
    "support",
    "oppose",
    "context",
    "needs-review",
  ]);
  const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
  function fail(message) {
    throw new Error(message);
  }
  function object(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail(label + ": expected an object / 应为对象");
  }
  function string(value, max, label, required) {
    if (
      typeof value !== "string" ||
      value.length > max ||
      value.includes("\u0000")
    )
      fail(label + ": invalid or too long / 无效或超长");
    if (required && !value.trim()) fail(label + ": required / 不能为空");
    return value;
  }
  function identifier(value) {
    if (typeof value !== "string" || !idPattern.test(value))
      fail("Invalid ID / 无效标识符");
    return value;
  }
  function timestamp(value) {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    )
      fail("Invalid timestamp / 无效时间");
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== value)
      fail("Invalid timestamp / 无效时间");
    return value;
  }
  function normalizeUrl(value) {
    string(value, 2000, "Source URL", false);
    if (!value.trim()) return "";
    let url;
    try {
      url = new URL(value.trim());
    } catch (_) {
      fail("Use a complete http(s) source URL / 请填写完整 http(s) 来源链接");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      fail(
        "Only http(s) URLs without credentials / 仅支持不含凭据的 http(s) 链接",
      );
    return url.href;
  }
  function paragraphs(content) {
    return content
      .replace(/\r\n?/g, "\n")
      .split(/\n[ \t]*\n+/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  function validateDocuments(documents) {
    if (!Array.isArray(documents) || documents.length > LIMITS.documents)
      fail("At most 60 documents / 最多 60 份文档");
    const ids = new Set();
    let totalChars = 0;
    let paragraphCount = 0;
    const result = documents.map((doc) => {
      object(doc, "Document");
      const id = identifier(doc.id);
      if (ids.has(id)) fail("Duplicate document ID / 文档标识重复");
      ids.add(id);
      const title = string(doc.title, 140, "Title", true).trim();
      const content = string(
        doc.content,
        LIMITS.documentChars,
        "Document content",
        true,
      ).replace(/\r\n?/g, "\n");
      totalChars += content.length;
      paragraphCount += paragraphs(content).length;
      if (!["user", "synthetic"].includes(doc.origin))
        fail("Invalid document origin / 无效文档类型");
      return {
        id,
        title,
        sourceUrl: normalizeUrl(doc.sourceUrl),
        content,
        origin: doc.origin,
        createdAt: timestamp(doc.createdAt),
      };
    });
    if (totalChars > LIMITS.totalChars || paragraphCount > LIMITS.paragraphs)
      fail(
        "Corpus limit: 1.2M characters / 8,000 paragraphs / 语料超出总量限制",
      );
    return result;
  }
  function validateState(input) {
    object(input, "Backup");
    if (input.version !== 1)
      fail("Unsupported backup version / 不支持此备份版本");
    const documents = validateDocuments(input.documents);
    if (
      !Array.isArray(input.evidence) ||
      input.evidence.length > LIMITS.evidence
    )
      fail("At most 1,000 evidence notes / 最多 1,000 条证据记录");
    const docMap = new Map(documents.map((doc) => [doc.id, doc]));
    const ids = new Set();
    const evidence = input.evidence.map((item) => {
      object(item, "Evidence");
      const id = identifier(item.id);
      if (ids.has(id)) fail("Duplicate evidence ID / 证据标识重复");
      ids.add(id);
      const documentId = identifier(item.documentId);
      const doc = docMap.get(documentId);
      if (
        !Number.isInteger(item.paragraphIndex) ||
        item.paragraphIndex < 1 ||
        item.paragraphIndex > LIMITS.paragraphs
      )
        fail("Invalid paragraph position / 无效段落位置");
      const excerpt = string(
        item.excerpt,
        LIMITS.documentChars,
        "Excerpt",
        true,
      );
      const documentTitle = string(
        item.documentTitle,
        140,
        "Snapshot title",
        true,
      ).trim();
      const sourceUrl = normalizeUrl(item.sourceUrl);
      if (!["user", "synthetic"].includes(item.origin))
        fail("Invalid snapshot origin / 无效快照类型");
      if (
        typeof item.documentVersion !== "string" ||
        !/^v1-[0-9a-f]{8}$/.test(item.documentVersion)
      )
        fail("Invalid snapshot version / 无效快照版本");
      if (
        doc &&
        item.documentVersion === fingerprint(doc) &&
        (excerpt !== paragraphs(doc.content)[item.paragraphIndex - 1] ||
          documentTitle !== doc.title ||
          sourceUrl !== doc.sourceUrl ||
          item.origin !== doc.origin)
      )
        fail("Snapshot differs from current source / 快照与当前来源不一致");
      if (!RELATIONS.includes(item.relationship))
        fail("Invalid evidence relationship / 无效证据关系");
      return {
        id,
        claim: string(item.claim, 2000, "Claim", true).trim(),
        documentId,
        documentTitle,
        sourceUrl,
        origin: item.origin,
        documentVersion: item.documentVersion,
        paragraphIndex: item.paragraphIndex,
        excerpt,
        relationship: item.relationship,
        note: string(item.note, 4000, "Note", false),
        createdAt: timestamp(item.createdAt),
      };
    });
    const result = { version: 1, documents, evidence };
    if (
      new TextEncoder().encode(JSON.stringify(result)).length >
      LIMITS.backupBytes
    )
      fail("Notebook exceeds 8 MB / 笔记总量超出 8 MB");
    return result;
  }
  function fingerprint(doc) {
    const text = JSON.stringify([
      doc.title,
      doc.sourceUrl,
      doc.origin,
      doc.content,
    ]);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return "v1-" + (hash >>> 0).toString(16).padStart(8, "0");
  }
  function sourceStatus(item, documents) {
    const doc = documents.find((value) => value.id === item.documentId);
    return !doc
      ? "removed"
      : fingerprint(doc) !== item.documentVersion
        ? "changed"
        : "current";
  }
  function tokenize(text) {
    const lower = String(text).normalize("NFKC").toLowerCase();
    const tokens = [];
    const segments =
      lower.match(/[\p{Script=Han}]+|[a-z0-9]+(?:['’-][a-z0-9]+)*/gu) || [];
    for (const segment of segments) {
      if (/^[\p{Script=Han}]+$/u.test(segment)) {
        const chars = Array.from(segment);
        for (let i = 0; i < chars.length; i++) {
          tokens.push(chars[i]);
          if (i + 1 < chars.length) tokens.push(chars[i] + chars[i + 1]);
        }
      } else tokens.push(segment);
    }
    return tokens;
  }
  function buildIndex(documents) {
    const docs = validateDocuments(documents);
    const entries = [];
    const documentFrequency = new Map();
    for (const doc of docs)
      paragraphs(doc.content).forEach((text, i) => {
        const tokens = tokenize(text);
        const frequencies = new Map();
        for (const token of tokens)
          frequencies.set(token, (frequencies.get(token) || 0) + 1);
        for (const token of frequencies.keys())
          documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
        entries.push({
          paragraphId: doc.id + ":p" + (i + 1),
          documentId: doc.id,
          title: doc.title,
          sourceUrl: doc.sourceUrl,
          origin: doc.origin,
          paragraphIndex: i + 1,
          text,
          length: tokens.length,
          frequencies,
        });
      });
    return {
      entries,
      documentFrequency,
      avgLength: entries.length
        ? entries.reduce((sum, entry) => sum + entry.length, 0) / entries.length
        : 0,
    };
  }
  function search(index, query, options) {
    string(query, LIMITS.queryChars, "Query", false);
    const opts = options || {};
    const method = opts.method || "bm25";
    if (!["bm25", "keyword"].includes(method))
      fail("Unsupported retrieval method");
    const limit = opts.limit === undefined ? 10 : opts.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      fail("Invalid search limit");
    const terms = [...new Set(tokenize(query))];
    if (!terms.length || !index.entries.length) return [];
    const k1 = 1.2;
    const b = 0.75;
    const N = index.entries.length;
    const avg = index.avgLength || 1;
    const results = [];
    for (const entry of index.entries) {
      let score = 0;
      const matchedTerms = [];
      const contributions = [];
      for (const term of terms) {
        const tf = entry.frequencies.get(term) || 0;
        if (!tf) continue;
        const df = index.documentFrequency.get(term) || 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const contribution =
          method === "keyword"
            ? tf
            : (idf * (tf * (k1 + 1))) /
              (tf + k1 * (1 - b + (b * entry.length) / avg));
        score += contribution;
        matchedTerms.push(term);
        contributions.push({ term, tf, df, idf, contribution });
      }
      if (score > 0)
        results.push({
          paragraphId: entry.paragraphId,
          documentId: entry.documentId,
          title: entry.title,
          sourceUrl: entry.sourceUrl,
          origin: entry.origin,
          paragraphIndex: entry.paragraphIndex,
          text: entry.text,
          length: entry.length,
          score,
          matchedTerms,
          contributions,
        });
    }
    return results
      .sort(
        (a, c) =>
          c.score - a.score || a.paragraphId.localeCompare(c.paragraphId, "en"),
      )
      .slice(0, limit);
  }
  function evaluate(documents, cases, method, k) {
    const index = buildIndex(documents);
    const cutoff = k || 5;
    const rows = cases.map((test) => {
      const retrieved = search(index, test.query, {
        method: method || "bm25",
        limit: 100,
      }).map((result) => result.paragraphId);
      const relevant = new Set(test.relevant);
      const recall =
        [...relevant].filter((id) => retrieved.slice(0, cutoff).includes(id))
          .length / relevant.size;
      const rank = retrieved.findIndex((id) => relevant.has(id));
      return {
        id: test.id,
        query: test.query,
        relevant: test.relevant,
        top: retrieved.slice(0, cutoff),
        recall,
        reciprocalRank: rank < 0 ? 0 : 1 / (rank + 1),
      };
    });
    return {
      method: method || "bm25",
      k: cutoff,
      count: rows.length,
      recallAtK:
        rows.reduce((sum, row) => sum + row.recall, 0) / (rows.length || 1),
      mrr:
        rows.reduce((sum, row) => sum + row.reciprocalRank, 0) /
        (rows.length || 1),
      rows,
    };
  }
  function markdownText(value) {
    return String(value).replace(/([\\`*_{}\[\]<>#|~!])/g, "\\$1");
  }
  function exportMarkdown(input) {
    const state = validateState(input);
    const rows = [
      "# Evidence Atlas · 证据笔记",
      "",
      "> Research notes; source accuracy, authority, and claim support require human review. / 研究笔记；来源真实性、效力与论断支持关系须人工复核。",
      "",
    ];
    if (!state.evidence.length)
      rows.push("No evidence saved. / 暂无证据记录。", "");
    state.evidence.forEach((item, i) => {
      rows.push(
        "## " + (i + 1) + ". " + markdownText(item.claim),
        "",
        "- Relationship / 关系: " + item.relationship,
        "- Source snapshot / 来源快照: " +
          markdownText(item.documentTitle) +
          " · paragraph / 段落 " +
          item.paragraphIndex,
        "- Snapshot status / 状态: " +
          sourceStatus(item, state.documents) +
          " · " +
          item.documentVersion,
        "- Origin / 类型: " +
          (item.origin === "synthetic"
            ? "Synthetic educational example / 教学合成示例"
            : "User-supplied; unverified / 用户导入；未经核实"),
        "- URL: " +
          (item.sourceUrl
            ? "<" + item.sourceUrl + ">"
            : "Not supplied / 未提供"),
        "",
        ...item.excerpt.split("\n").map((line) => "> " + markdownText(line)),
        "",
        "Note / 批注: " + markdownText(item.note || "—"),
        "",
      );
    });
    return rows.join("\n");
  }
  function exportCitations(input) {
    const state = validateState(input);
    return [
      "SOURCE LOCATORS / 来源定位（非规范化法律引注）",
      "Unverified research locators, not legal citation compliance. / 仅为未经核实的研究来源定位，不能替代法学引注规范。",
      "",
      ...state.evidence.map(
        (item, i) =>
          i +
          1 +
          ". " +
          item.documentTitle +
          ", paragraph / 段落 " +
          item.paragraphIndex +
          (item.sourceUrl
            ? ", " + item.sourceUrl
            : " [URL not supplied / 未提供链接]") +
          (item.origin === "synthetic"
            ? " [SYNTHETIC / 合成示例]"
            : " [UNVERIFIED / 未核实]") +
          " [snapshot: " +
          sourceStatus(item, state.documents) +
          "; " +
          item.documentVersion +
          "]",
      ),
    ].join("\n");
  }
  return Object.freeze({
    LIMITS,
    RELATIONS,
    paragraphs,
    tokenize,
    normalizeUrl,
    validateDocuments,
    validateState,
    fingerprint,
    sourceStatus,
    buildIndex,
    search,
    evaluate,
    exportMarkdown,
    exportCitations,
  });
});
