"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../engine.js");
const Samples = require("../sample-corpus.js");
const date = "2026-10-04T00:00:00.000Z";
function doc(id, content, extra) {
  return {
    id,
    title: id,
    content,
    sourceUrl: "",
    origin: "user",
    createdAt: date,
    ...extra,
  };
}
function note(source, extra) {
  return {
    id: "note-1",
    claim: "A claim requiring review",
    documentId: source.id,
    documentTitle: source.title,
    sourceUrl: source.sourceUrl,
    origin: source.origin,
    documentVersion: C.fingerprint(source),
    paragraphIndex: 1,
    excerpt: C.paragraphs(source.content)[0],
    relationship: "needs-review",
    note: "",
    createdAt: date,
    ...extra,
  };
}
function state(documents, evidence) {
  return { version: 1, documents: documents || [], evidence: evidence || [] };
}

test("Chinese unigram/bigram tokens preserve lexical overlap; English normalizes case and fullwidth", () => {
  assert.deepEqual(C.tokenize("人工 AI ＬＬＭ"), [
    "人",
    "人工",
    "工",
    "ai",
    "llm",
  ]);
});
test("Paragraph splitting normalizes CRLF and preserves one-based positions", () => {
  assert.deepEqual(
    C.paragraphs("  first\r\nline\r\n \r\nsecond\n\n\nthird  "),
    ["first\nline", "second", "third"],
  );
  const results = C.search(
    C.buildIndex([doc("a", "first\nline\n\nsecond")]),
    "second",
  );
  assert.equal(results[0].paragraphIndex, 2);
  assert.equal(results[0].paragraphId, "a:p2");
});
test("BM25 uses an independently calculated single-token score", () => {
  const index = C.buildIndex([doc("a", "alpha alpha"), doc("b", "beta")]);
  const result = C.search(index, "alpha")[0];
  const expected =
    (Math.log(1 + 1.5 / 1.5) * 2 * 2.2) / (2 + 1.2 * (0.25 + (0.75 * 2) / 1.5));
  assert.ok(Math.abs(result.score - expected) < 1e-12);
  assert.equal(result.contributions[0].tf, 2);
  assert.equal(result.contributions[0].df, 1);
});
test("Length normalization ranks concise relevant paragraphs ahead of verbose ones", () => {
  const index = C.buildIndex([
    doc("short", "oversight"),
    doc("long", "oversight " + "unrelated ".repeat(80)),
  ]);
  assert.equal(C.search(index, "oversight")[0].documentId, "short");
});
test("Term frequency baseline differs from BM25 and reports contributions", () => {
  const index = C.buildIndex([
    doc("a", "alpha alpha beta"),
    doc("b", "alpha beta"),
  ]);
  const result = C.search(index, "alpha beta", { method: "keyword" })[0];
  assert.equal(result.score, 3);
  assert.equal(
    result.contributions.reduce((sum, term) => sum + term.contribution, 0),
    3,
  );
});
test("Repeated query tokens do not silently overweight a term", () => {
  const index = C.buildIndex([doc("a", "alpha alpha beta")]);
  assert.equal(
    C.search(index, "alpha")[0].score,
    C.search(index, "alpha alpha alpha")[0].score,
  );
});
test("Empty and unmatched queries return no fabricated answers", () => {
  const index = C.buildIndex([doc("a", "alpha")]);
  assert.deepEqual(C.search(index, ""), []);
  assert.deepEqual(C.search(index, "quasar"), []);
  assert.deepEqual(C.search(C.buildIndex([]), "alpha"), []);
});
test("Ranking ties have stable paragraph IDs", () => {
  const index = C.buildIndex([doc("z", "alpha"), doc("a", "alpha")]);
  assert.deepEqual(
    C.search(index, "alpha").map((item) => item.documentId),
    ["a", "z"],
  );
});
test("Synthetic Chinese and English queries retrieve identifiable source paragraphs", () => {
  const index = C.buildIndex(Samples.documents);
  assert.equal(
    C.search(index, "福利申请 资格判断 人工复核")[0].paragraphId,
    "demo-welfare:p1",
  );
  assert.equal(
    C.search(index, "bias audit evaluation metrics reproducibility")[0]
      .paragraphId,
    "demo-audit:p2",
  );
});
test("Evaluation returns fixed finite values with explicit challenging cases", () => {
  assert.equal(Samples.cases.length, 30);
  assert.equal(
    Samples.cases.filter((item) => item.id.startsWith("challenge")).length,
    6,
  );
  const report = C.evaluate(Samples.documents, Samples.cases, "bm25", 5);
  assert.equal(report.count, 30);
  assert.equal(report.rows.length, 30);
  assert.ok(report.recallAtK >= 0 && report.recallAtK <= 1);
  assert.ok(report.mrr >= 0 && report.mrr <= 1);
  assert.ok(report.rows.every((row) => row.recall >= 0 && row.recall <= 1));
});
test("Recall@k and reciprocal rank use manually specified relevant sets", () => {
  const docs = [doc("a", "alpha"), doc("b", "beta"), doc("c", "gamma")];
  const report = C.evaluate(
    docs,
    [{ id: "q", query: "alpha beta", relevant: ["a:p1", "b:p1"] }],
    "keyword",
    1,
  );
  assert.equal(report.recallAtK, 0.5);
  assert.equal(report.mrr, 1);
});
test("Document IDs reject attribute injection and duplicates", () => {
  assert.throws(() => C.validateDocuments([doc('bad\" onclick=evil', "text")]));
  assert.throws(() =>
    C.validateDocuments([doc("same", "text"), doc("same", "text")]),
  );
});
test("Source links reject executable schemes and credential-bearing links", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///tmp/x",
    "https://user:secret@example.com/",
  ])
    assert.throws(() => C.normalizeUrl(url));
  assert.equal(
    C.normalizeUrl(" https://example.com/source "),
    "https://example.com/source",
  );
});
test("Strings are preserved as text, while invalid structures and versions are rejected", () => {
  const malicious = doc("safe", '<img src=x onerror="alert(1)">', {
    title: "<script>text</script>",
  });
  assert.equal(C.validateDocuments([malicious])[0].content, malicious.content);
  assert.throws(() =>
    C.validateState({ version: 1, documents: [{}], evidence: [] }),
  );
  assert.throws(() =>
    C.validateState({ version: 2, documents: [], evidence: [] }),
  );
  assert.throws(() =>
    C.validateState({ version: 1, documents: [], evidence: null }),
  );
});
test("Document count, content length, query size and paragraph limits are enforced", () => {
  assert.throws(() =>
    C.validateDocuments(
      Array.from({ length: 61 }, (_, i) => doc("d" + i, "x")),
    ),
  );
  assert.throws(() => C.validateDocuments([doc("long", "a".repeat(120001))]));
  assert.throws(() => C.validateDocuments([doc("many", "a\n\n".repeat(8001))]));
  assert.throws(() => C.search(C.buildIndex([]), "a".repeat(501)));
  assert.throws(() =>
    C.search(C.buildIndex([]), "alpha", { method: "pretend-semantic" }),
  );
});
test("Corpus total size cannot bypass each document's size cap", () => {
  assert.throws(() =>
    C.validateDocuments(
      Array.from({ length: 11 }, (_, i) => doc("d" + i, "a".repeat(120000))),
    ),
  );
});
test("Dates must be real canonical ISO timestamps", () => {
  assert.throws(() =>
    C.validateDocuments([
      doc("a", "text", { createdAt: "2026-02-31T00:00:00.000Z" }),
    ]),
  );
  assert.throws(() =>
    C.validateDocuments([doc("a", "text", { createdAt: "tomorrow" })]),
  );
});
test("Rejected import leaves the caller's state untouched", () => {
  const original = state([doc("a", "alpha")]);
  const before = JSON.stringify(original);
  assert.throws(() =>
    C.validateState({
      ...original,
      documents: [doc("a", "alpha"), doc("a", "duplicate")],
    }),
  );
  assert.equal(JSON.stringify(original), before);
});
test("Validated state is a clone without unknown executable metadata", () => {
  const input = state([doc("a", "alpha", { extra: "ignored" })]);
  input.untrusted = { action: "evil" };
  const clean = C.validateState(input);
  assert.equal(clean.untrusted, undefined);
  assert.equal(clean.documents[0].extra, undefined);
  clean.documents[0].title = "changed";
  assert.equal(input.documents[0].title, "a");
});
test("Current-source evidence requires exact paragraph and metadata", () => {
  const source = doc("a", "first\n\nsecond");
  assert.throws(() =>
    C.validateState(state([source], [note(source, { excerpt: "invented" })])),
  );
  assert.throws(() =>
    C.validateState(
      state([source], [note(source, { documentTitle: "different" })]),
    ),
  );
  assert.throws(() =>
    C.validateState(state([source], [note(source, { paragraphIndex: 0 })])),
  );
});
test("Editing or removing a source preserves a visibly changed or removed quote snapshot", () => {
  const source = doc("a", "original paragraph");
  const saved = note(source);
  const edited = doc("a", "updated paragraph");
  const changed = C.validateState(state([edited], [saved]));
  assert.equal(changed.evidence[0].excerpt, "original paragraph");
  assert.equal(C.sourceStatus(saved, changed.documents), "changed");
  const removed = C.validateState(state([], [saved]));
  assert.equal(C.sourceStatus(saved, removed.documents), "removed");
  assert.equal(C.sourceStatus(saved, [source]), "current");
});
test("Evidence validation rejects duplicate IDs, unsupported relations and oversized claims", () => {
  const source = doc("a", "original");
  const saved = note(source);
  assert.throws(() => C.validateState(state([source], [saved, saved])));
  assert.throws(() =>
    C.validateState(
      state([source], [note(source, { relationship: "proven-legal" })]),
    ),
  );
  assert.throws(() =>
    C.validateState(
      state([source], [note(source, { claim: "x".repeat(2001) })]),
    ),
  );
});
test("Exports label synthetic authority and stale source status without rewriting the quotation", () => {
  const source = Samples.documents[0];
  const saved = note(source, {
    relationship: "support",
    note: "Needs external verification",
  });
  const data = state([], [saved]);
  const markdown = C.exportMarkdown(data);
  const citations = C.exportCitations(data);
  assert.match(markdown, /Synthetic educational example/);
  assert.match(markdown, /removed/);
  assert.match(markdown, /Needs external verification/);
  assert.match(citations, /SYNTHETIC/);
  assert.match(citations, /not legal citation compliance/);
});
test("Markdown export escapes HTML and markup without silently deleting literal source text", () => {
  const source = doc("a", "<script>alert(1)</script>\n# header\n`code`");
  const markdown = C.exportMarkdown(
    state([source], [note(source, { claim: "[link](evil)", note: "<img>" })]),
  );
  assert.ok(!markdown.includes("<script>"));
  assert.match(markdown, /\\<script\\>/);
  assert.match(markdown, /> \\# header/);
  assert.match(markdown, /\\\[link\\\]/);
});
test("JSON round-trip preserves exact source and note positions", () => {
  const source = doc("a", "甲段\n\nSecond paragraph", {
    sourceUrl: "https://example.com/research",
  });
  const data = C.validateState(state([source], [note(source)]));
  assert.deepEqual(C.validateState(JSON.parse(JSON.stringify(data))), data);
});
