---
name: i18n-translation
description: Manages internationalization for the Overseas Insurance Digital Platform per PRD chapter 4. Scans t() calls to extract keys, validates translations against the insurance glossary (forbidden translations like Carrier→承运商), checks en-US/zh-CN consistency, and generates translation progress reports by namespace. Use when the user mentions i18n, 翻译, 国际化, translation progress, 术语校验, or asks to add/audit translation keys.
---

# i18n Translation（国际化翻译管理）

依据需求文档第四章规范，管理平台 i18n 翻译资源：key 扫描提取、术语校验、中英一致性检查、进度报告。

## 基线规范（来自需求文档 4.3/4.4）

### 框架与命名空间
- 框架：react-i18next + i18next + i18next-browser-languagedetector
- 默认语言 `en-US`，可选 `zh-CN`；检测顺序 `localStorage('i18nextLng') → navigator`
- 6 个命名空间及职责：

| 命名空间 | 职责 | 估算 key 数 |
|---|---|---|
| common | 通用操作/状态/布局文案 | ~40 |
| carrier | 保险公司域（主数据/产品/合作/合规/财务/分析） | ~80 |
| channel | 渠道域（组织/代理人/层级/入驻/授权/绩效/培训/门户） | ~100 |
| commission | 佣金域（方案/计算/结算/追回） | ~60 |
| finance | 财务域（账单/对账/发票） | ~53 |
| error | 错误码与提示 | ~40 |

### Key 命名规范
```
命名空间:模块.字段.描述
示例：carrier:insurers.list.title
      carrier:insurers.form.addNew
      commission:calculation.status.pendingParse
```
- 模块对应页面目录结构，字段对应 UI 元素或状态
- 枚举/状态对象使用 `labelKey` 模式（存 key，渲染时 `t()` 包装），禁止存储原始文案
- 动态内容用插值：`t('detail', { agentName, amount, date })`，禁止字符串拼接
- 禁止硬编码文案；禁止在数据层存储翻译后文本

## 工作流程

### 模式 A：Key 扫描提取

```
- [ ] 1. 在代码中检索 t('...') / t("...") / labelKey 调用
- [ ] 2. 按组件路径推断命名空间（views/组件 → 业务域映射）
- [ ] 3. 生成提取清单：{ 命名空间, key, 出现位置, 当前文案 }
- [ ] 4. 与已有翻译文件对比，标记 新增/删除/修改
- [ ] 5. 输出 extracted-keys-{日期}.json + 差异报告
```

组件路径 → 命名空间映射：
| 组件/视图前缀 | 命名空间 |
|---|---|
| Insurer*/Product*/Cooperation*/Appointment*/Finance*/InsurerAnalytics* | carrier / finance（财务对账类归 finance） |
| Channel*/Onboarding*/Hierarchy*/Performance*/Training*/Portal* | channel |
| Commission* | commission |
| 公共组件（TopBar/Sidebar/通用按钮） | common |

### 模式 B：翻译编写/审查

编写或审查翻译时必须执行术语校验（见下节）。翻译文件结构：
```json
{
  "list": {
    "title": "财务管理",
    "search": { "placeholder": "搜索发票、交易..." },
    "actions": { "download": "下载", "export": "导出" }
  }
}
```
检查项：
- JSON 语法合法（无尾随逗号）
- en-US 与 zh-CN 文件 key 集合完全一致（数量与路径逐一对应）
- 插值占位符（`{{name}}` 等）两种语言中都保留且拼写一致
- 特殊字符（引号/换行/HTML 标签）正确转义
- 数字、货币符号 `$`、百分比保留不翻译

### 模式 C：进度报告

输出格式：
```
# 翻译进度报告 {日期}
| 命名空间 | 总 key | 已翻译 | 完成率 | 负责人 | 阶段 |
|---|---|---|---|---|---|
| finance | 53 | 53 | 100% | Team B | Phase 0-P0 |
| ... |
总计：~373 keys，整体完成率 {x}%
未翻译重点项：[命名空间: key 列表]
```
阶段对照：Phase 0（finance 验证）→ Phase 1（carrier+channel）→ Phase 2（commission+error）→ Phase 3（common+优化）→ Phase 4（补全）。

## 保险术语库（校验基准，禁译规则）

翻译中出现以下术语时，必须使用标准译法；**禁译项命中即判定为错误**：

| 英文 | 标准中文 | 禁译/注意 |
|---|---|---|
| Carrier | 保险公司 | ❌ 承运商 |
| Agent | 代理人 | ❌ 简单译为"代理" |
| Broker | 经纪人 | 代表客户利益 |
| MGA | 管理总代理 | Managing General Agent |
| FMO | 顶层营销组织 | Field Marketing Organization |
| Appointment | 任命备案 | 州监管层面的授权 |
| NPN | 全美代理人编号 | National Producer Number |
| NIPR | 全美代理人注册中心 | — |
| NAIC | 全美保险监管官协会 | — |
| Override | 层级管理费津贴 | 上层对下级的提成 |
| Chargeback | 退保追回 | 负佣金 |
| E&O Insurance | 职业责任险 | Errors & Omissions |
| Admitted Carrier | 认可保险公司 | 持州牌照 |
| Non-Admitted Carrier | 非认可保险公司 | Surplus Lines |
| Premium | 保费 | ❌ 红利 |
| Commission | 佣金 | ❌ 委员会 |
| Underwriting | 核保 | ❌ 承保过程 |
| Binding Authority | 出单授权 | MGA 自主出单权限 |
| Retention | 自留额 | — |
| Reinsurance | 再保险 | — |
| Policy | 保单 | — |
| Endorsement | 批改 | 保单内容变更 |
| Renewal | 续保 | — |
| Pro-rata | 按比例 | 按未到期天数 |
| Contingent Commission | 或有佣金 | 基于赔付率后付 |
| Trail Commission | 服务佣金 | 长期保单年度服务费 |

完整术语表以需求文档 4.7 节为准。

## 常见陷阱（审查时重点检查）

1. ❌ 状态对象直接存文案字符串 → ✅ 存 `labelKey`，渲染时 `t(opt.labelKey)`
2. ❌ JSX 中硬编码英文/中文文本 → ✅ 全部 `t()` 外置
3. ❌ 翻译缺失时显示 raw key → ✅ 配置 fallbackLng=en-US 兜底
4. ❌ 中文长文本溢出布局 → ✅ 审查时检查容器是否允许换行
5. ❌ 混用语义相近的不同 key → ✅ 同义文案复用同一 key（common 优先）

## 交付物

每次任务输出：操作模式（A/B/C）、涉及命名空间、新增/修改/删除 key 明细、术语校验结果（含命中禁译项的修正）、进度数字变化。
