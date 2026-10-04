# Method and limits / 方法与边界

## 1. Unit of retrieval / 检索单元

UTF-8 TXT / Markdown text is normalized from CRLF to LF, trimmed, and split on blank lines. Each nonempty paragraph is one retrieval entry with a one-based position, document ID, title, origin label, and optional source URL. Markdown is treated as plain text; the app does not fetch links, infer original page numbers, or evaluate citation authority. A single newline stays in its paragraph.

TXT / Markdown 原文统一换行、去除段首尾空白，以空行分段。每个非空段落保留文档标识、标题、来源类型、可选链接与从 1 开始的段落位置。Markdown 按纯文本处理；不访问链接，不推断原始页码，不判断来源权威。一个普通换行仍保留在同段。

## 2. Tokenization / 词语表示

Text uses Unicode NFKC normalization and lowercase conversion. Contiguous Han-script sequences emit individual characters and overlapping adjacent pairs; English/ASCII alphanumeric sequences emit word tokens, retaining internal apostrophes and hyphens. For example, `人工 AI` becomes `人`, `人工`, `工`, `ai`. Punctuation separates tokens. There is no dictionary segmentation, stemming, synonym expansion, embedding, or language model. Titles are displayed but not included in scoring. The query's repeated tokens are deduplicated.

文本使用 NFKC 规范化和小写转换。连续汉字生成单字与相邻双字 token；英文/ASCII 字母数字片段生成词 token，保留词内撇号和连字符。标点分隔词语。不进行词典分词、词干化、同义词扩展或向量计算，不调用语言模型。标题用于展示，不参与排序。查询中重复 token 只计一次。

Chinese single-character overlap can create noisy matches. A query's abstract synonym may not retrieve the intended passage. The score breakdown shows exactly which tokens matched.

中文单字共现可能产生噪声；抽象同义表达可能检索不到目标段落。分数明细明确展示实际匹配 token。

## 3. BM25 and the baseline / BM25 与基线

For each unique query term that appears in a paragraph:

```text
idf(t) = ln(1 + (N - df(t) + 0.5) / (df(t) + 0.5))
score(t, p) = idf(t) * tf(t, p) * (k1 + 1)
              / (tf(t, p) + k1 * (1 - b + b * length(p) / averageLength))
score(p) = sum score(t, p)
k1 = 1.2; b = 0.75
```

`N` is the number of paragraphs; `df` counts paragraphs containing the token; `tf` is paragraph token frequency. Paragraph length includes both Chinese single-character and bigram tokens. The baseline sums matching token frequencies with no IDF or length normalization. Both use the same corpus and tokenizer. Only positive-score paragraphs are returned; ties use paragraph IDs for deterministic order. Scores are comparable within a query and method, not calibrated probabilities or legal evaluations.

`N` 是段落数，`df` 是包含某 token 的段落数，`tf` 是该段落中的词频。段长同时计入中文单字和双字 token。词频基线仅对命中词频求和，不使用 IDF 或段长归一化。两者共享语料与 tokenizer。仅返回正分段落；同分时按段落标识稳定排序。分数不是概率或法律判断。

The positive IDF variant and the chosen k₁ / b defaults are documented in the primary [Apache Lucene 9.9.1 BM25Similarity API](https://lucene.apache.org/core/9_9_1/core/org/apache/lucene/search/similarities/BM25Similarity.html). This project implements its own paragraph/token model in plain JavaScript. / 正值 IDF 变体与 k₁、b 默认取值可见 Apache Lucene 的官方文档；本项目以原生 JavaScript 独立实现段落与 token 模型。

## 4. Claims and historical snapshots / 论断与历史快照

Saving a passage copies its exact paragraph text, one-based paragraph position, original title, source URL, origin, and a version fingerprint. Claim, relationship (`support`, `oppose`, `context`, `needs-review`), and note are editable. The quote is not editable in the notebook: import corrected source text and save a new evidence entry instead.

保存证据时复制完整原文段落、段落位置、原始标题、链接、来源类型与版本指纹。论断、关系和批注可编辑；笔记中的摘录不能修改，需要更正原文时应修改语料，再建立新的证据记录。

Editing or removing documents keeps saved quotes. A changed fingerprint produces `changed`; a missing document produces `removed`. Fingerprints use FNV-1a over document metadata and content to detect routine changes. They are non-cryptographic and neither authenticate externally imported snapshots nor prove absence of deliberate tampering. An imported historical snapshot cannot be verified against a missing original; it stays visibly historical.

编辑或移除文档不会改变既有摘录。指纹变化标记为“原文已变”，文档不存在标记为“原文已删除”。FNV-1a 对文档元数据与内容计算指纹，用于提示普通变化；它不是密码学认证，不能证明外部快照真实性或排除蓄意篡改。缺少原始文档的历史快照保持明确的历史状态。

Current-version evidence must exactly match its paragraph, title, URL, and origin during validation. Relationship labels are human judgments, not machine confirmation of entailment.

校验时，声称对应当前版本的证据须精确匹配原段、标题、链接与来源类型。支持关系由人判断，不代表机器确认逻辑蕴含。

## 5. Evaluation protocol / 评价协议

The committed fixture contains 12 bilingual synthetic documents and 36 paragraphs on social law / AI governance themes. It contains no legal quotations, real decisions, or personal data. Thirty fixed queries have manually assigned relevant paragraph IDs: 24 vocabulary-aligned Chinese/English sanity checks, plus 6 paraphrase challenges, including one query with two relevant paragraphs.

固定语料含 12 份双语合成文档、36 个段落；主题是社会法与 AI 治理，不含法律引文、真实裁判或个人信息。30 个固定查询预先指定相关段落：24 个中英词汇对齐检验与 6 个改写挑战，其中一个查询有两个相关段落。

- Recall@5 = number of relevant paragraphs among the first five results / number of relevant paragraphs.
- Reciprocal rank = 1 / rank of the first relevant result; zero if absent.
- MRR = mean reciprocal rank across queries. The evaluator ranks up to 100 positive-score paragraphs; all 36 fixture paragraphs fit, so fixture MRR is untruncated.

This is a reproducibility and failure-analysis demonstration. Cases share vocabulary with the fixture and were designed alongside it; no train/test independence or statistical generalization is claimed. A high score here is not evidence of legal reliability. Paraphrase failures illustrate why embeddings, query expansion, and stronger evaluation sets need separate testing. The browser benchmark always uses pristine fixed fixtures and never mutates the user corpus.

这是复现与失败分析演示。查询与语料一并设计，许多查询共享原文词语，未建立训练/测试独立性或统计泛化主张。此处高分不能证明法律可靠性。改写失败提醒研究者单独评价嵌入、查询扩展和更强测试集。浏览器基准始终使用原始固定样本，不改写用户语料。

See [measured report](benchmark.md) and [ranked results](benchmark.json); reproduce using `npm run benchmark`.

## 6. Input boundaries and storage / 输入边界与存储

Validation builds a new typed state without mutating the caller. IDs, document/paragraph counts, string lengths, dates, URL protocols, relationships, snapshots, and total serialized byte size are checked before replacement. Unknown object keys are dropped. Multiple text files are validated as one candidate, so a failing file rejects the whole batch. The UI uses `textContent`, DOM text nodes, and fixed event handlers rather than inserting source HTML. `http:` and `https:` links are accepted without credentials and open with `noopener noreferrer`.

校验建立新的规范状态，不修改原对象。替换前检查标识、文档/段落数量、文本长度、日期、链接协议、关系、快照与序列化总字节数；移除未知字段。多文件导入作为整体校验，任意文件失败则整批不写入。界面通过 DOM 文本节点展示材料，不把来源内容作为 HTML 插入。链接限定为不含凭据的 http(s)，使用 `noopener noreferrer` 打开。

Local storage can fail. The page continues with in-memory data and a persistent warning requesting JSON export. Clearing browser data remains outside the app's control. The app uses no network API, cookies, or third-party scripts; visiting the site or opening an external source link still follows ordinary browser networking.

本地存储可能失败；页面保留内存状态，并持续提示导出 JSON。浏览器清理数据不受应用控制。应用不调用网络 API、不使用 cookie 或第三方脚本；访问网站或打开外部链接仍有普通浏览器网络行为。
