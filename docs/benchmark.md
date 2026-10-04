# Retrieval benchmark / 检索基准

This is a reproducible educational benchmark, not a legal corpus evaluation. / 可复现教学基准，不代表真实法律语料的检索效果。

- Corpus: 12 bilingual synthetic documents, 36 paragraphs. No real laws or cases.
- Queries: 30 manually labeled cases, 15 Chinese and 15 English; 24 vocabulary-aligned queries plus 6 paraphrase challenges.
- Relevance labels: manually fixed paragraph IDs in `sample-corpus.js`; one challenge has two relevant paragraphs.
- Both methods use the same tokenizer. BM25 uses k₁ = 1.2, b = 0.75. Token-frequency baseline sums matching term frequencies.
- Recall@5 measures the share of relevant paragraphs in the first five results. MRR measures reciprocal rank of the first relevant result; the fixture has only 36 paragraphs, within the 100-result evaluator limit.

| Method | Recall@5 | MRR |
|---|---:|---:|
| bm25 | 0.9333 | 0.9410 |
| keyword | 0.9333 | 0.9259 |

The vocabulary-aligned cases are intentionally simple sanity checks. Paraphrase cases expose lexical retrieval failures. These figures do not establish superiority, semantic understanding, legal reliability, or performance on other collections. / 前 24 个词汇对齐查询用于基本检验，改写挑战用于暴露词语检索的局限；结果不能证明语义理解、法律可靠性或跨语料泛化。

## Per-query results / 单项结果

| ID | Query | BM25 Recall@5 | BM25 RR | Keyword Recall@5 | Keyword RR |
|---|---|---:|---:|---:|---:|
| zh-01 | 招聘筛选 年龄歧视 错误排除率 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-01 | hiring screening age discrimination false rejection | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-02 | 工资核验 计价规则 原始工时 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-02 | wage verification pricing versions working hours | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-03 | 跨地区 社会保险 缴费衔接 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-03 | social insurance contribution portability regions | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-04 | 偏差审计 测试集 标注指标 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-04 | bias audit evaluation metrics reproducibility | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-05 | 工作场所监控 员工邮件 告知 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-05 | workplace monitoring employee email notice | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-06 | 福利申请 资格判断 人工复核 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-06 | welfare applications eligibility human oversight | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-07 | 证据链 规则版本 发布日期 溯源 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-07 | evidence trail rule version publication provenance | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-08 | 训练语料最小化 重新识别风险 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-08 | training data minimization reidentification | 1.00 | 1.000 | 1.00 | 0.500 |
| zh-09 | 决策解释 可解释性 透明度 忠实 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-09 | decision explanations transparency faithfulness | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-10 | 申诉救济 回应时间 纠错成本 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-10 | appeals remedies correction contestation costs | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-11 | 无障碍服务 目标群体 完成率 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-11 | accessible services intended users dropout | 1.00 | 1.000 | 1.00 | 1.000 |
| zh-12 | 模型漂移 检索召回率 固定测试集 | 1.00 | 1.000 | 1.00 | 1.000 |
| en-12 | model drift monitoring retrieval recall test set | 1.00 | 1.000 | 1.00 | 1.000 |
| challenge-en-01 | Can workers contest a deactivation? | 0.00 | 0.063 | 0.00 | 0.111 |
| challenge-en-02 | When a chatbot handles benefit forms who decides entitlement? | 0.00 | 0.167 | 0.00 | 0.167 |
| challenge-en-03 | Deleting unnecessary training fields | 1.00 | 1.000 | 1.00 | 1.000 |
| challenge-zh-01 | 机器人不能直接批准低保申请 | 1.00 | 1.000 | 1.00 | 1.000 |
| challenge-zh-02 | 换城市后参保记录接不上怎么办 | 1.00 | 1.000 | 1.00 | 1.000 |
| challenge-zh-03 | 自动停单以后骑手怎样提出异议 | 1.00 | 1.000 | 1.00 | 1.000 |

Reproduce with `npm run benchmark`. Exact ranked paragraph IDs and numeric results are in [benchmark.json](benchmark.json). Browser evaluation uses the same engine and fixed fixtures without replacing user data.
