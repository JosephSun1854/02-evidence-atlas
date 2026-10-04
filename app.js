(function () {
  "use strict";
  const Core = window.EvidenceAtlasCore;
  const Samples = window.EvidenceAtlasSamples;
  const STORAGE_KEY = "law-ai-evidence-atlas-v1";
  const $ = (selector) => document.querySelector(selector);
  const relations = {
    support: "支持 / Supports",
    oppose: "反对 / Opposes",
    context: "背景 / Context",
    "needs-review": "待复核 / Needs review",
  };
  const statusLabels = {
    current: "原文未变 / Source unchanged",
    changed: "原文已变 · 快照 / Source changed · snapshot",
    removed: "原文已删除 · 快照 / Source removed · snapshot",
  };
  let state = { version: 1, documents: [], evidence: [] };
  let index = Core.buildIndex([]);
  let results = [];
  let pendingEvidence = null;
  let benchmark = null;
  let statusTimeout;
  function make(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined && text !== null) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function button(text, handler, className) {
    const element = make("button", text, className);
    element.type = "button";
    element.addEventListener("click", handler);
    return element;
  }
  function uniqueId(prefix) {
    return (
      prefix +
      "-" +
      (window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2))
    );
  }
  function toast(message) {
    $("#status").textContent = message;
    $("#status").hidden = false;
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      $("#status").hidden = true;
    }, 6000);
  }
  function storageWarning(message) {
    $("#storageWarning").textContent = message;
    $("#storageWarning").hidden = false;
  }
  function safely(action) {
    return async function (event) {
      try {
        await action(event);
      } catch (error) {
        toast(error.message || "操作失败 / Operation failed");
      }
    };
  }
  function commit(candidate) {
    const next = Core.validateState(candidate); // Validation finishes before either memory or stored state changes.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      $("#storageWarning").hidden = true;
    } catch (_) {
      storageWarning(
        "当前修改仅保存在本次页面中：浏览器存储不可用或已满，请立即导出 JSON。 / Changes are in this page only: storage is unavailable or full. Export JSON before closing.",
      );
    }
    state = next;
    index = Core.buildIndex(state.documents);
    renderCorpus();
    renderNotebook();
    renderStats();
    if ($("#query").value.trim()) runSearch();
    else renderResults();
  }
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        if (new TextEncoder().encode(saved).length > Core.LIMITS.backupBytes)
          throw new Error("Backup exceeds limits");
        state = Core.validateState(JSON.parse(saved));
        index = Core.buildIndex(state.documents);
      }
    } catch (_) {
      storageWarning(
        "无法读取本地数据；旧数据尚未覆盖。可恢复有效备份，或导入新语料后继续。 / Local data could not be read; existing storage has not been overwritten. Restore a valid backup or import a new corpus.",
      );
    }
  }
  function renderStats() {
    const data = [
      [state.documents.length, "文档 / Documents"],
      [index.entries.length, "段落 / Paragraphs"],
      [state.evidence.length, "证据记录 / Evidence notes"],
      [
        state.documents.filter((doc) => doc.origin === "synthetic").length,
        "教学样本 / Synthetic docs",
      ],
    ];
    $("#stats").replaceChildren(
      ...data.map(([count, label]) => {
        const item = make("div", null, "stat");
        item.append(make("strong", String(count)), make("span", label));
        return item;
      }),
    );
  }
  function renderCorpus() {
    const list = $("#documentList");
    if (!state.documents.length) {
      list.replaceChildren(
        make(
          "p",
          "尚无语料。添加文档或载入教学示例。 / Add a document or load the demo.",
          "note corpus-empty",
        ),
      );
      return;
    }
    list.replaceChildren(
      ...state.documents.map((doc) => {
        const item = make("article", null, "document-item");
        const heading = make("h3", doc.title);
        const meta = make(
          "p",
          Core.paragraphs(doc.content).length +
            " 段 / paragraphs · " +
            (doc.origin === "synthetic"
              ? "合成示例 / Synthetic"
              : "用户材料 / User text"),
          "note",
        );
        const actions = make("div", null, "actions document-actions");
        actions.append(
          button("编辑 / Edit", () => openDocument(doc.id)),
          button(
            "移除 / Remove",
            safely(() => {
              if (
                !window.confirm(
                  "移除此文档？已保存的证据快照仍会保留。 / Remove this document? Saved evidence snapshots will remain.",
                )
              )
                return;
              commit({
                ...state,
                documents: state.documents.filter((item) => item.id !== doc.id),
              });
              toast(
                "文档已移除；证据快照保留。 / Document removed; evidence snapshots retained.",
              );
            }),
            "danger",
          ),
        );
        item.append(heading, meta, actions);
        return item;
      }),
    );
  }
  function sourceLink(url, label) {
    if (!url) return make("span", "未提供链接 / No source URL", "muted");
    const link = make("a", label || "来源链接 / Source ↗");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }
  function highlighted(text, terms) {
    const element = make("p", null, "result-excerpt");
    const unique = [...new Set(terms)].sort((a, b) => b.length - a.length);
    if (!unique.length) {
      element.textContent = text;
      return element;
    }
    const pattern = new RegExp(
      unique
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
      "giu",
    );
    let last = 0;
    let match;
    while ((match = pattern.exec(text))) {
      element.append(
        document.createTextNode(text.slice(last, match.index)),
        make("mark", match[0]),
      );
      last = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(last)));
    return element;
  }
  function renderResults() {
    const list = $("#results");
    list.replaceChildren();
    if (!results.length) {
      const empty = make("div", null, "empty");
      empty.append(
        make(
          "h3",
          state.documents.length
            ? "从一个具体问题开始 / Start with a question"
            : "先建立研究语料 / Build your corpus",
        ),
        make(
          "p",
          state.documents.length
            ? "输入原文中的关键词；词语匹配不足时，可调整表达或检查语料。 / Use source-text terms; revise the query or review your corpus when matches are weak."
            : "粘贴文本，导入 TXT / MD，或载入标明性质的教学示例。 / Paste text, import TXT / MD, or load the clearly labeled synthetic demo.",
        ),
      );
      list.append(empty);
      return;
    }
    results.forEach((result, i) => {
      const card = make("article", null, "result-card");
      const head = make("div", null, "result-head");
      const labels = make("div");
      labels.append(
        make("span", String(i + 1).padStart(2, "0"), "result-rank"),
        make("strong", result.title),
      );
      head.append(
        labels,
        make("span", "Score " + result.score.toFixed(3), "score mono"),
      );
      const meta = make("div", null, "result-meta");
      meta.append(
        make("span", "段落 / ¶ " + result.paragraphIndex),
        make(
          "span",
          result.origin === "synthetic"
            ? "教学合成示例 / Synthetic"
            : "用户材料 · 未核实 / User text · unverified",
          "badge",
        ),
        sourceLink(result.sourceUrl),
      );
      const explanation = make("details", null, "score-details");
      explanation.append(make("summary", "分数如何计算 / Score breakdown"));
      explanation.append(
        make(
          "p",
          "段长 / length: " +
            result.length +
            " tokens · 平均 / average: " +
            index.avgLength.toFixed(1) +
            " · 命中 / matched: " +
            result.matchedTerms.length +
            " tokens",
          "note",
        ),
      );
      const table = make("table");
      const thead = make("thead");
      const header = make("tr");
      ["Term / 词", "TF", "DF", "IDF", "贡献 / Contribution"].forEach((value) =>
        header.append(make("th", value)),
      );
      thead.append(header);
      const body = make("tbody");
      result.contributions.forEach((row) => {
        const tr = make("tr");
        [
          row.term,
          row.tf,
          row.df,
          row.idf.toFixed(3),
          row.contribution.toFixed(3),
        ].forEach((value) => tr.append(make("td", String(value))));
        body.append(tr);
      });
      table.append(thead, body);
      const tableWrap = make("div", null, "table-scroll");
      tableWrap.append(table);
      explanation.append(tableWrap);
      card.append(
        head,
        meta,
        highlighted(result.text, result.matchedTerms),
        button(
          "加入证据笔记 / Save evidence",
          () => openEvidence(result),
          "save-evidence",
        ),
        explanation,
      );
      list.append(card);
    });
  }
  function runSearch() {
    const query = $("#query").value.trim();
    results = Core.search(index, query, {
      method: $("#method").value,
      limit: Number($("#resultLimit").value),
    });
    $("#searchSummary").textContent = query
      ? results.length +
        " 个匹配段落（最多 " +
        $("#resultLimit").value +
        " 个）；分数不是置信度。 / Matching paragraphs; scores are not confidence estimates."
      : "";
    renderResults();
    if (query && !results.length) {
      $("#results h3").textContent = "未找到词语匹配 / No lexical matches";
    }
  }
  function renderNotebook() {
    const list = $("#notebook");
    list.replaceChildren();
    if (!state.evidence.length) {
      const empty = make("div", null, "empty notebook-empty");
      empty.append(
        make("h3", "让每条论断留下来源 / Give claims a source trail"),
        make(
          "p",
          "检索后保存原文，并标注支持、反对、背景或待复核。 / Save a retrieved paragraph and annotate its relationship.",
        ),
      );
      list.append(empty);
      return;
    }
    state.evidence.forEach((item) => {
      const card = make("article", null, "evidence-card");
      const head = make("div", null, "section-head");
      head.append(
        make("h3", item.claim),
        make(
          "span",
          relations[item.relationship],
          "badge" + (item.relationship === "needs-review" ? " warning" : ""),
        ),
      );
      const sourceState = Core.sourceStatus(item, state.documents);
      const meta = make("div", null, "result-meta");
      meta.append(
        make("span", item.documentTitle + " · ¶ " + item.paragraphIndex),
        make(
          "span",
          statusLabels[sourceState],
          "badge" + (sourceState === "current" ? "" : " warning"),
        ),
        sourceLink(item.sourceUrl),
      );
      const quote = make("blockquote", item.excerpt, "evidence-preview");
      const note = make(
        "p",
        item.note || "尚无批注 / No annotation",
        "evidence-note",
      );
      const actions = make("div", null, "actions document-actions");
      actions.append(
        button("编辑批注 / Edit note", () => openEvidence(null, item)),
        button(
          "删除 / Delete",
          safely(() => {
            if (
              !window.confirm("删除这条证据记录？ / Delete this evidence note?")
            )
              return;
            commit({
              ...state,
              evidence: state.evidence.filter((value) => value.id !== item.id),
            });
            toast("证据记录已删除。 / Evidence note deleted.");
          }),
          "danger",
        ),
      );
      card.append(head, meta, quote, note, actions);
      list.append(card);
    });
  }
  function openDocument(id) {
    const doc = state.documents.find((value) => value.id === id);
    $("#documentForm").reset();
    $("#documentId").value = doc ? doc.id : "";
    $("#documentTitle").value = doc ? doc.title : "";
    $("#documentUrl").value = doc ? doc.sourceUrl : "";
    $("#documentContent").value = doc ? doc.content : "";
    $("#documentEditNotice").hidden = !doc;
    $("#documentDialogTitle").textContent = doc
      ? "编辑文档 / Edit document"
      : "添加文档 / Add document";
    $("#documentDialog").showModal();
  }
  function openEvidence(result, existing) {
    if (existing) pendingEvidence = { ...existing };
    else {
      const doc = state.documents.find(
        (value) => value.id === result.documentId,
      );
      pendingEvidence = {
        id: uniqueId("evidence"),
        documentId: doc.id,
        documentTitle: doc.title,
        sourceUrl: doc.sourceUrl,
        origin: doc.origin,
        documentVersion: Core.fingerprint(doc),
        paragraphIndex: result.paragraphIndex,
        excerpt: result.text,
        claim: "",
        note: "",
        relationship: "needs-review",
        createdAt: new Date().toISOString(),
      };
    }
    $("#evidenceForm").reset();
    $("#evidenceId").value = existing ? existing.id : "";
    $("#evidenceClaim").value = pendingEvidence.claim;
    $("#evidenceRelation").value = pendingEvidence.relationship;
    $("#evidenceNote").value = pendingEvidence.note;
    $("#evidenceSource").textContent =
      pendingEvidence.documentTitle +
      " · ¶ " +
      pendingEvidence.paragraphIndex +
      " · " +
      (pendingEvidence.origin === "synthetic"
        ? "教学合成示例 / Synthetic educational example"
        : "用户材料 · 未核实 / User material · unverified");
    $("#evidenceExcerpt").textContent = pendingEvidence.excerpt;
    $("#evidenceDialogTitle").textContent = existing
      ? "编辑证据 / Edit evidence"
      : "保存证据 / Save evidence";
    $("#evidenceDialog").showModal();
  }
  function download(filename, content, type) {
    const url = URL.createObjectURL(
      new Blob([content], { type: type || "text/plain;charset=utf-8" }),
    );
    const link = make("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function benchmarkMarkdown() {
    const [bm25, keyword] = benchmark;
    const rows = [
      "# Evidence Atlas: reproducible retrieval benchmark",
      "",
      "Synthetic educational corpus only: 12 bilingual documents, 36 paragraphs, 30 manually specified queries (15 Chinese / 15 English; 6 paraphrase challenges). No real legal sources. No claim of generalization.",
      "",
      "BM25: k1 = 1.2, b = 0.75. Both methods use identical Chinese unigram/bigram + English tokenization. Keyword baseline sums matched token frequencies. MRR uses the full ranked positive-score list (up to 100); Recall@5 uses five results.",
      "",
      "| Method | Recall@5 | MRR |",
      "|---|---:|---:|",
      "| BM25 | " +
        bm25.recallAtK.toFixed(4) +
        " | " +
        bm25.mrr.toFixed(4) +
        " |",
      "| Token frequency | " +
        keyword.recallAtK.toFixed(4) +
        " | " +
        keyword.mrr.toFixed(4) +
        " |",
      "",
      "| ID | Query | BM25 recall@5 | BM25 RR | Keyword recall@5 | Keyword RR |",
      "|---|---|---:|---:|---:|---:|",
    ];
    bm25.rows.forEach((row, i) =>
      rows.push(
        "| " +
          row.id +
          " | " +
          row.query +
          " | " +
          row.recall.toFixed(2) +
          " | " +
          row.reciprocalRank.toFixed(3) +
          " | " +
          keyword.rows[i].recall.toFixed(2) +
          " | " +
          keyword.rows[i].reciprocalRank.toFixed(3) +
          " |",
      ),
    );
    return rows.join("\n") + "\n";
  }
  function runBenchmark() {
    benchmark = [
      Core.evaluate(Samples.documents, Samples.cases, "bm25", 5),
      Core.evaluate(Samples.documents, Samples.cases, "keyword", 5),
    ];
    $("#benchmarkSummary").replaceChildren(
      ...benchmark.map((report) => {
        const item = make("div", null, "stat");
        item.append(
          make(
            "h3",
            report.method === "bm25" ? "BM25" : "词频 / Token frequency",
          ),
          make("strong", (report.recallAtK * 100).toFixed(1) + "%"),
          make("span", "Recall@5 · MRR " + report.mrr.toFixed(3)),
        );
        return item;
      }),
    );
    const table = make("table");
    const head = make("thead");
    const header = make("tr");
    ["ID", "查询 / Query", "BM25 RR", "词频 RR", "Recall@5"].forEach((value) =>
      header.append(make("th", value)),
    );
    head.append(header);
    const body = make("tbody");
    benchmark[0].rows.forEach((row, i) => {
      const tr = make("tr");
      [
        row.id,
        row.query,
        row.reciprocalRank.toFixed(3),
        benchmark[1].rows[i].reciprocalRank.toFixed(3),
        row.recall.toFixed(2) + " / " + benchmark[1].rows[i].recall.toFixed(2),
      ].forEach((value) => tr.append(make("td", value)));
      body.append(tr);
    });
    table.append(head, body);
    $("#benchmarkRows").replaceChildren(table);
    $("#benchmarkDialog").showModal();
  }
  $("#addDocument").addEventListener("click", () => openDocument());
  $("#documentForm").addEventListener(
    "submit",
    safely((event) => {
      event.preventDefault();
      const id = $("#documentId").value;
      const old = state.documents.find((doc) => doc.id === id);
      const doc = {
        id: old ? old.id : uniqueId("doc"),
        title: $("#documentTitle").value.trim(),
        sourceUrl: $("#documentUrl").value.trim(),
        content: $("#documentContent").value,
        origin: "user",
        createdAt: old ? old.createdAt : new Date().toISOString(),
      };
      const documents = old
        ? state.documents.map((value) => (value.id === id ? doc : value))
        : [...state.documents, doc];
      commit({ ...state, documents });
      $("#documentDialog").close();
      toast("文档已保存。 / Document saved.");
    }),
  );
  $("#evidenceForm").addEventListener(
    "submit",
    safely((event) => {
      event.preventDefault();
      if (!pendingEvidence) return;
      const item = {
        ...pendingEvidence,
        claim: $("#evidenceClaim").value.trim(),
        relationship: $("#evidenceRelation").value,
        note: $("#evidenceNote").value,
      };
      const existing = state.evidence.some((value) => value.id === item.id);
      const evidence = existing
        ? state.evidence.map((value) => (value.id === item.id ? item : value))
        : [...state.evidence, item];
      commit({ ...state, evidence });
      $("#evidenceDialog").close();
      pendingEvidence = null;
      toast("证据快照与批注已保存。 / Evidence snapshot and annotation saved.");
    }),
  );
  $("#loadDemo").addEventListener(
    "click",
    safely(() => {
      const imported = Samples.documents.filter(
        (doc) => !state.documents.some((value) => value.id === doc.id),
      );
      if (!imported.length) {
        toast(
          "教学示例已在语料中；基准实验始终使用原始版本。 / Demo already present; the benchmark always uses original fixtures.",
        );
        return;
      }
      commit({ ...state, documents: [...state.documents, ...imported] });
      $("#query").value = "福利申请 资格判断 人工复核";
      runSearch();
      toast(
        "载入 12 份教学合成文档；没有真实法律来源。 / Loaded 12 synthetic educational documents; no real legal sources.",
      );
    }),
  );
  $("#importTexts").addEventListener("click", () => $("#textFiles").click());
  $("#textFiles").addEventListener(
    "change",
    safely(async (event) => {
      const files = Array.from(event.target.files || []);
      try {
        if (!files.length) return;
        if (files.length + state.documents.length > Core.LIMITS.documents)
          throw new Error("最多 60 份文档 / At most 60 documents");
        for (const file of files)
          if (
            file.size > Core.LIMITS.fileBytes ||
            !/\.(txt|md)$/i.test(file.name)
          )
            throw new Error(
              "只接受 ≤2 MB 的 TXT / MD 文件。 / Only TXT / MD files up to 2 MB.",
            );
        const imported = [];
        for (const file of files)
          imported.push({
            id: uniqueId("doc"),
            title: file.name.slice(0, 140),
            content: await file.text(),
            sourceUrl: "",
            origin: "user",
            createdAt: new Date().toISOString(),
          });
        commit({ ...state, documents: [...state.documents, ...imported] });
        toast(files.length + " 份文档已导入。 / Documents imported.");
      } finally {
        event.target.value = "";
      }
    }),
  );
  $("#searchForm").addEventListener(
    "submit",
    safely((event) => {
      event.preventDefault();
      runSearch();
    }),
  );
  $("#method").addEventListener("change", safely(runSearch));
  $("#resultLimit").addEventListener("change", safely(runSearch));
  document.querySelectorAll("[data-query]").forEach((element) =>
    element.addEventListener(
      "click",
      safely(() => {
        $("#query").value = element.dataset.query;
        runSearch();
      }),
    ),
  );
  document
    .querySelectorAll("[data-close]")
    .forEach((element) =>
      element.addEventListener("click", () =>
        document.getElementById(element.dataset.close).close(),
      ),
    );
  $("#exportMarkdown").addEventListener(
    "click",
    safely(() =>
      download(
        "evidence-atlas-notebook.md",
        Core.exportMarkdown(state),
        "text/markdown;charset=utf-8",
      ),
    ),
  );
  $("#exportCitations").addEventListener(
    "click",
    safely(() =>
      download(
        "evidence-atlas-source-locators.txt",
        Core.exportCitations(state),
      ),
    ),
  );
  $("#exportJson").addEventListener(
    "click",
    safely(() =>
      download(
        "evidence-atlas-backup.json",
        JSON.stringify(Core.validateState(state)),
        "application/json;charset=utf-8",
      ),
    ),
  );
  $("#importBackup").addEventListener("click", () => $("#backupFile").click());
  $("#backupFile").addEventListener(
    "change",
    safely(async (event) => {
      const file = event.target.files[0];
      try {
        if (!file) return;
        if (file.size > Core.LIMITS.backupBytes)
          throw new Error("备份最大 8 MB / Backup must be at most 8 MB");
        let candidate;
        try {
          candidate = Core.validateState(JSON.parse(await file.text()));
        } catch (error) {
          throw new Error(
            "未导入，当前数据保留。 / Nothing imported; current data retained. " +
              error.message,
          );
        }
        if (
          !window.confirm(
            "备份已通过完整校验。替换当前语料与笔记？请先导出需保留的数据。 / Backup validated. Replace the current corpus and notebook? Export anything you need to keep first.",
          )
        )
          return;
        commit(candidate);
        toast("备份已恢复。 / Backup restored.");
      } finally {
        event.target.value = "";
      }
    }),
  );
  $("#runBenchmark").addEventListener("click", safely(runBenchmark));
  $("#exportBenchmark").addEventListener(
    "click",
    safely(() => {
      if (benchmark)
        download(
          "evidence-atlas-benchmark.md",
          benchmarkMarkdown(),
          "text/markdown;charset=utf-8",
        );
    }),
  );
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY)
      storageWarning(
        "其他页面修改了本地笔记。请先导出当前数据，再刷新加载最新版本，避免覆盖。 / Another tab changed the notebook. Export current data, then reload to avoid overwriting changes.",
      );
  });
  load();
  renderStats();
  renderCorpus();
  renderNotebook();
  renderResults();
})();
