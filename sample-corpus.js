(function (root, factory) {
  "use strict";
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.EvidenceAtlasSamples = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const createdAt = "2026-10-04T00:00:00.000Z";
  const texts = [
    [
      "hiring",
      "01 · 招聘筛选 / Hiring screening",
      [
        "【教学合成材料】某虚构研究组讨论大语言模型用于招聘筛选时的年龄歧视风险，建议比较不同年龄候选人的错误排除率。Synthetic educational material: a fictional team examines age discrimination in large language model hiring screening and compares false rejection rates across age groups.",
        "研究者不能仅凭总体准确率判断公平性，还应记录职位要求、样本分组和不利结果。Overall accuracy alone cannot establish fairness; the study records job requirements, group definitions, and adverse outcomes.",
        "这一讨论并非真实案例或法律规则。候选人是否拥有特定请求权，需要另外检索适用法与事实。This discussion is not a real case or legal rule; applicable law and facts must be checked separately.",
      ],
    ],
    [
      "wages",
      "02 · 平台劳动报酬 / Platform wages",
      [
        "【教学合成材料】某虚构平台使用自动调度系统，劳动者关心等待时间是否纳入报酬计算。研究方案将接单、等待、行程与休息分别记录。Synthetic educational material: workers on a fictional platform ask whether waiting time counts toward remuneration; the study separates acceptance, waiting, travel, and rest.",
        "工资核验表应保留计价规则版本、原始工时与申诉记录，以比较算法调度前后的收入波动。A wage verification sheet keeps pricing rule versions, original working hours, and complaints to compare income variation before and after algorithmic scheduling.",
        "示例不对劳动关系认定或最低工资义务作结论。The example reaches no conclusion about employment status or minimum wage obligations.",
      ],
    ],
    [
      "insurance",
      "03 · 社会保险衔接 / Insurance portability",
      [
        "【教学合成材料】跨地区流动的虚构劳动者希望核对社会保险缴费记录的衔接。研究者按月份整理参保地区、缴费主体与记录缺口。Synthetic educational material: a fictional mobile worker checks social insurance contribution portability across regions; researchers organize regions, contributors, and missing months.",
        "一个大语言模型助手可以整理待核验问题，但不能自行确定待遇资格或补缴金额；原始缴费凭证应可追溯。A large language model assistant may organize verification questions but cannot establish benefit eligibility or arrears; original contribution receipts remain traceable.",
        "本材料不包含真实政策、办事规则或当事人信息。This material contains no real policy, administrative procedure, or personal information.",
      ],
    ],
    [
      "audit",
      "04 · 偏差审计 / Bias audit",
      [
        "【教学合成材料】某虚构审计实验评估大语言模型生成的劳动争议摘要。审计人员比较性别群体的遗漏率，并记录标注分歧。Synthetic educational material: a fictional audit assesses large language model labor dispute summaries, compares omission rates across gender groups, and records annotation disagreement.",
        "偏差审计需要预先定义评价指标、测试集和失败样本；模型版本与提示词版本同时归档，以便重复实验。A bias audit defines evaluation metrics, test sets, and failure examples in advance; model and prompt versions are archived for reproducibility.",
        "指标差异是进一步调查的线索，并不自动证明法律意义上的歧视。Metric differences invite further investigation and do not automatically prove legally actionable discrimination.",
      ],
    ],
    [
      "monitoring",
      "05 · 工作场所监控 / Workplace monitoring",
      [
        "【教学合成材料】虚构企业拟用生成式人工智能分析员工邮件。研究讨论工作场所监控的必要性、范围与告知方式。Synthetic educational material: a fictional employer proposes generative AI analysis of employee email; researchers examine workplace monitoring necessity, scope, and notice.",
        "实验设置最小化收集、限定访问人员与到期删除三个控制变量，避免将私人通信默认纳入训练语料。The experiment varies data minimization, restricted access, and scheduled deletion, without treating private correspondence as default training data.",
        "此研究设计不构成对任何具体企业监控方案的合法性意见。This research design is not a legality opinion on any employer's surveillance scheme.",
      ],
    ],
    [
      "welfare",
      "06 · 福利人工监督 / Welfare oversight",
      [
        "【教学合成材料】某虚构公共服务原型使用大语言模型整理福利申请。方案要求关键资格判断由工作人员人工复核，并保留原始申请材料。Synthetic educational material: a fictional public service prototype uses a large language model to organize welfare applications; staff perform human oversight of eligibility decisions and preserve originals.",
        "研究者区分材料摘要、风险提示与最终决定，避免自动化输出被误当作行政结论。Researchers separate document summaries, risk signals, and final decisions to prevent automation output from being mistaken for an administrative conclusion.",
        "示例没有给出真实福利项目、办理期限或资格标准。The example specifies no real welfare program, procedural deadline, or eligibility threshold.",
      ],
    ],
    [
      "versions",
      "07 · 规则版本定位 / Rule version provenance",
      [
        "【教学合成材料】研究者比较一份虚构平台用工规则的两个版本，重点查看薪酬说明和申诉入口是否改变。Synthetic educational material: researchers compare two versions of a fictional platform work rule and inspect changes in remuneration descriptions and complaint entry points.",
        "证据链应记录规则版本、发布日期、原文段落和取得时间。只保存一段模型总结会丢失版本溯源，降低后续复核能力。An evidence trail records rule version, publication date, original paragraph, and retrieval time; keeping only a model summary loses version provenance and weakens review.",
        "版本对照本身不能确定新规则是否适用于某一历史争议。Version comparison alone cannot decide whether a new rule applies to a historical dispute.",
      ],
    ],
    [
      "privacy",
      "08 · 训练语料最小化 / Training data minimization",
      [
        "【教学合成材料】某虚构研究团队考虑以社会保障咨询文本训练大语言模型。研究先识别身份证号、医疗信息与家庭情况等敏感字段。Synthetic educational material: a fictional team considers training a large language model on social security consultations and identifies identity numbers, medical details, and family circumstances.",
        "训练语料最小化方案只保留回答研究问题所需字段，并评估去标识化后的重新识别风险。The training data minimization plan retains fields necessary for the research question and evaluates reidentification risks after deidentification.",
        "材料中的流程仅是研究假设，并非真实授权或个人信息处理规则。The workflow is a research hypothesis, not real authorization or a personal data processing rule.",
      ],
    ],
    [
      "explanation",
      "09 · 决策解释 / Decision explanations",
      [
        "【教学合成材料】某虚构系统向劳动者说明为何推荐某个培训课程。解释应区分已使用的输入、推荐理由与无法确认的推断。Synthetic educational material: a fictional system explains a training recommendation to workers, separating used inputs, recommendation reasons, and uncertain inferences.",
        "可解释性记录保存决策解释、模型版本、输入字段和人工纠正，便于透明度评估；语言流畅不等于解释忠实。An explainability record stores decision explanations, model versions, input fields, and human corrections for transparency evaluation; fluent language does not guarantee explanation faithfulness.",
        "此材料不声称任何特定解释已满足法律要求。This material does not claim that an explanation satisfies legal requirements.",
      ],
    ],
    [
      "appeals",
      "10 · 申诉救济 / Appeals and remedies",
      [
        "【教学合成材料】某虚构平台的自动暂停接单决定引发劳动者申诉。研究方案设置人工复核、理由告知与补充证据入口。Synthetic educational material: a fictional platform's automated suspension triggers worker appeals; the study provides human review, reasons, and an additional evidence channel.",
        "申诉救济评价分别测量回应时间、纠错结果与提出异议的实际成本，而不只统计入口点击量。An appeals and remedies evaluation measures response time, correction outcomes, and practical contestation costs rather than only entry point clicks.",
        "示例不确定任何真实争议的法定救济渠道或期限。The example identifies no statutory remedy or deadline for any real dispute.",
      ],
    ],
    [
      "accessibility",
      "11 · 无障碍服务 / Accessible services",
      [
        "【教学合成材料】虚构社会保障咨询助手面向残障人士提供文本和语音入口。研究关注读屏顺序、清晰语言与替代交互方式。Synthetic educational material: a fictional social security assistant offers text and voice interfaces for disabled people; researchers study screen reader order, plain language, and alternative interactions.",
        "无障碍服务评价应邀请目标群体参与，记录任务完成率、退出原因和人工求助路径。Accessible service evaluation involves intended users and records task completion rates, dropout reasons, and routes to human assistance.",
        "合成示例不代表真实服务已通过无障碍测试或法规核验。The synthetic example does not represent a real service passing accessibility tests or regulatory verification.",
      ],
    ],
    [
      "drift",
      "12 · 部署监测 / Deployment monitoring",
      [
        "【教学合成材料】某虚构劳动咨询助手上线后发现问题分布发生变化。研究按月抽样记录大语言模型回答中的遗漏、无依据引用与拒答。Synthetic educational material: a fictional labor advice assistant sees changing query distributions after deployment; monthly samples record omissions, unsupported citations, and refusals.",
        "模型漂移监测比较部署前后检索召回率和错误类型；遇到版本更新时重新运行固定测试集，并公布无法回答的边界。Model drift monitoring compares retrieval recall and error types before and after deployment; version updates trigger a fixed test set and explicit limits on answerability.",
        "固定测试集表现不能推断所有新问题均能正确处理。Fixed test set performance does not imply correct handling of every new question.",
      ],
    ],
  ];
  const documents = texts.map(([id, title, content]) => ({
    id: "demo-" + id,
    title,
    content: content.join("\n\n"),
    sourceUrl: "",
    origin: "synthetic",
    createdAt,
  }));
  const queryPairs = [
    [
      "hiring",
      1,
      "招聘筛选 年龄歧视 错误排除率",
      "hiring screening age discrimination false rejection",
    ],
    [
      "wages",
      2,
      "工资核验 计价规则 原始工时",
      "wage verification pricing versions working hours",
    ],
    [
      "insurance",
      1,
      "跨地区 社会保险 缴费衔接",
      "social insurance contribution portability regions",
    ],
    [
      "audit",
      2,
      "偏差审计 测试集 标注指标",
      "bias audit evaluation metrics reproducibility",
    ],
    [
      "monitoring",
      1,
      "工作场所监控 员工邮件 告知",
      "workplace monitoring employee email notice",
    ],
    [
      "welfare",
      1,
      "福利申请 资格判断 人工复核",
      "welfare applications eligibility human oversight",
    ],
    [
      "versions",
      2,
      "证据链 规则版本 发布日期 溯源",
      "evidence trail rule version publication provenance",
    ],
    [
      "privacy",
      2,
      "训练语料最小化 重新识别风险",
      "training data minimization reidentification",
    ],
    [
      "explanation",
      2,
      "决策解释 可解释性 透明度 忠实",
      "decision explanations transparency faithfulness",
    ],
    [
      "appeals",
      2,
      "申诉救济 回应时间 纠错成本",
      "appeals remedies correction contestation costs",
    ],
    [
      "accessibility",
      2,
      "无障碍服务 目标群体 完成率",
      "accessible services intended users dropout",
    ],
    [
      "drift",
      2,
      "模型漂移 检索召回率 固定测试集",
      "model drift monitoring retrieval recall test set",
    ],
  ];
  const cases = queryPairs.flatMap(
    ([topic, paragraph, chinese, english], i) => [
      {
        id: "zh-" + String(i + 1).padStart(2, "0"),
        query: chinese,
        relevant: ["demo-" + topic + ":p" + paragraph],
      },
      {
        id: "en-" + String(i + 1).padStart(2, "0"),
        query: english,
        relevant: ["demo-" + topic + ":p" + paragraph],
      },
    ],
  );
  cases.push(
    {
      id: "challenge-en-01",
      query: "Can workers contest a deactivation?",
      relevant: ["demo-appeals:p1"],
    },
    {
      id: "challenge-en-02",
      query: "When a chatbot handles benefit forms who decides entitlement?",
      relevant: ["demo-welfare:p1"],
    },
    {
      id: "challenge-en-03",
      query: "Deleting unnecessary training fields",
      relevant: ["demo-privacy:p2"],
    },
    {
      id: "challenge-zh-01",
      query: "机器人不能直接批准低保申请",
      relevant: ["demo-welfare:p1"],
    },
    {
      id: "challenge-zh-02",
      query: "换城市后参保记录接不上怎么办",
      relevant: ["demo-insurance:p1"],
    },
    {
      id: "challenge-zh-03",
      query: "自动停单以后骑手怎样提出异议",
      relevant: ["demo-appeals:p1", "demo-appeals:p2"],
    },
  );
  return {
    documents,
    cases,
    label:
      "Synthetic educational corpus; no legal authority / 教学合成语料；不具有法律权威性",
  };
});
