"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("../engine.js");
const S = require("../sample-corpus.js");
const reports = ["bm25", "keyword"].map((method) =>
  C.evaluate(S.documents, S.cases, method, 5),
);
const [bm25, keyword] = reports;
const round = (value) => Number(value.toFixed(8));
const json = {
  version: 1,
  corpus: "synthetic-social-law-ai-v1",
  documents: 12,
  paragraphs: 36,
  cases: 30,
  caveat:
    "Educational synthetic lexical-retrieval benchmark; no legal authority or generalization claim. Includes 6 paraphrase challenges.",
  parameters: { k1: 1.2, b: 0.75, recallCutoff: 5, mrrRankingLimit: 100 },
  reports: reports.map((report) => ({
    ...report,
    recallAtK: round(report.recallAtK),
    mrr: round(report.mrr),
    rows: report.rows.map((row) => ({
      ...row,
      recall: round(row.recall),
      reciprocalRank: round(row.reciprocalRank),
    })),
  })),
};
const lines = [
  "# Retrieval benchmark / 检索基准",
  "",
  "This is a reproducible educational benchmark, not a legal corpus evaluation. / 可复现教学基准，不代表真实法律语料的检索效果。",
  "",
  "- Corpus: 12 bilingual synthetic documents, 36 paragraphs. No real laws or cases.",
  "- Queries: 30 manually labeled cases, 15 Chinese and 15 English; 24 vocabulary-aligned queries plus 6 paraphrase challenges.",
  "- Relevance labels: manually fixed paragraph IDs in `sample-corpus.js`; one challenge has two relevant paragraphs.",
  "- Both methods use the same tokenizer. BM25 uses k₁ = 1.2, b = 0.75. Token-frequency baseline sums matching term frequencies.",
  "- Recall@5 measures the share of relevant paragraphs in the first five results. MRR measures reciprocal rank of the first relevant result; the fixture has only 36 paragraphs, within the 100-result evaluator limit.",
  "",
  "| Method | Recall@5 | MRR |",
  "|---|---:|---:|",
  ...reports.map(
    (report) =>
      "| " +
      report.method +
      " | " +
      report.recallAtK.toFixed(4) +
      " | " +
      report.mrr.toFixed(4) +
      " |",
  ),
  "",
  "The vocabulary-aligned cases are intentionally simple sanity checks. Paraphrase cases expose lexical retrieval failures. These figures do not establish superiority, semantic understanding, legal reliability, or performance on other collections. / 前 24 个词汇对齐查询用于基本检验，改写挑战用于暴露词语检索的局限；结果不能证明语义理解、法律可靠性或跨语料泛化。",
  "",
  "## Per-query results / 单项结果",
  "",
  "| ID | Query | BM25 Recall@5 | BM25 RR | Keyword Recall@5 | Keyword RR |",
  "|---|---|---:|---:|---:|---:|",
];
bm25.rows.forEach((row, i) =>
  lines.push(
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
lines.push(
  "",
  "Reproduce with `npm run benchmark`. Exact ranked paragraph IDs and numeric results are in [benchmark.json](benchmark.json). Browser evaluation uses the same engine and fixed fixtures without replacing user data.",
  "",
);
fs.writeFileSync(
  path.join(__dirname, "../docs/benchmark.md"),
  lines.join("\n"),
);
fs.writeFileSync(
  path.join(__dirname, "../docs/benchmark.json"),
  JSON.stringify(json, null, 2) + "\n",
);
console.log(
  reports
    .map(
      (report) =>
        report.method +
        ": Recall@5=" +
        report.recallAtK.toFixed(4) +
        ", MRR=" +
        report.mrr.toFixed(4),
    )
    .join("\n"),
);
