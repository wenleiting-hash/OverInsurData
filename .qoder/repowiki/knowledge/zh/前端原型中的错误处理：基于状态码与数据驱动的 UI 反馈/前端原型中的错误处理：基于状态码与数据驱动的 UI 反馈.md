---
kind: error_handling
name: 前端原型中的错误处理：基于状态码与数据驱动的 UI 反馈
category: error_handling
scope:
    - '**'
source_files:
    - 产品设计/UI-V1.0/src/data/channelMasterData.ts
    - 产品设计/UI-V1.0/src/views/ChannelMasterView.tsx
    - 产品设计/UI-V1.0/src/views/InsurerImport.tsx
    - 产品需求/产品功能清单_V1.0.0.md
---

## 1. 整体方案

该仓库是一个纯前端 React + TypeScript 原型（UI-V1.0），不包含后端服务代码，因此不存在传统意义上的“异常抛出/捕获”“全局错误中间件”或“panic/recover”。本项目的错误处理完全体现在**前端数据模型、视图渲染和导入流程的 UI 交互**中，核心思路是：**用结构化数据结构表达校验失败，再由视图按字段/行级别展示错误信息**。没有 `try/catch`、`throw new Error`、`.catch()` 等运行时异常处理模式出现在任何 `.tsx`/`.ts` 文件中。

## 2. 关键文件与位置

- **`src/data/channelMasterData.ts`**：定义批量导入结果类型，包含 `errors: { row: number; field: string; message: string }[]` 结构，用于承载每行每个字段的校验失败详情。
- **`src/views/ChannelMasterView.tsx`**：在导入完成步骤（`step === 'done'`）中，根据 `r.errors.length > 0` 条件渲染“错误详情”表格，列头为「行号 / 字段 / 错误说明」，使用 `AlertTriangle` 图标和红色主题色标识。
- **`src/views/InsurerImport.tsx`**：通过 `MOCK_PREVIEW` 数组模拟 Excel 解析结果，每条记录带 `ok: boolean` 与 `error?: string`；在预览表、校验结果页、确认页分别以不同方式呈现错误（行高亮、错误列表、统计卡片）。提供“下载错误报告”“跳过错误行，仅导入正常行”等操作按钮。
- **`产品需求/产品功能清单_V1.0.0.md`**：在“统计 Key 分布”部分明确列出命名空间 `common/carrier/channel/commission/finance/error`，将 `error` 作为独立业务命名空间纳入指标体系，表明错误本身被视为一等业务维度。

## 3. 架构与设计约定

### 3.1 错误建模：结构化而非异常
- 所有导入/校验错误都以**普通对象数组**形式存在，而不是 JavaScript 异常。典型结构：
  - `{ row, field, message }`：逐行逐字段定位错误来源。
  - `{ ok, error }`：简化版行级布尔标记加错误消息。
- 这种设计使错误成为可遍历、可过滤、可导出、可展示的数据，便于生成“错误报告”、统计失败率、支持“跳过错误行继续导入”等策略。

### 3.2 视图层错误呈现约定
- **颜色语义统一**：错误使用 `#BA1A1A`（红）或 `C.red`，成功使用绿色，警告使用琥珀色；通过 `orb orb-red`、`badge badge-red`、`bg: rgba(186,26,26,0.05)` 等样式类保持一致视觉。
- **层级化展示**：
  1. 概览卡片：显示“校验通过 / 校验失败 / 总计行数”三个数字。
  2. 明细表格：按行展开错误字段与消息。
  3. 操作区：提供“下载错误报告”“重新上传”“跳过错误行”等恢复动作。
- **无阻塞式错误**：错误不会中断用户流程——即使存在错误行，用户仍可进入下一步（确认导入），由业务规则决定最终落库行为。

### 3.3 业务状态中的错误分支
- 多处业务实体自带 `rejected` / `pending-supplement` / `expired` 等终态，例如代理人任命（`status: 'approved' | 'pending' | 'rejected' | 'expired' | 'terminated' | 'under-review'`）、合作申请（`CoopAppStatus`）、入驻申请（含 `rejected`、`training`、`pending-supplement`）。
- 这些状态不是运行时异常，而是持久化的业务状态机分支，配合 `rejectionReason` 字段共同构成“拒绝原因”的错误归因。

### 3.4 监控与度量层面的错误
- 需求文档要求按命名空间分类统计埋点 key，其中 `error` 是独立命名空间，意味着错误事件应与其他业务事件区分上报，便于后续分析错误率、热点错误类型。

## 4. 约定与约束

| 约定 | 证据来源 | 说明 |
|---|---|---|
| 不使用 `try/catch` 或 `throw` 处理业务错误 | 全仓 grep 搜索 `.tsx`/`.ts` 未匹配到相关关键字 | 业务错误以数据模型传递，不依赖 JS 异常流控制 |
| 导入失败必须提供逐行、逐字段错误明细 | `channelMasterData.ts` 类型定义 + `ChannelMasterView.tsx` 渲染逻辑 | 错误需包含 `row`、`field`、`message` 三要素 |
| 错误展示遵循统一的红色语义与 AlertTriangle 图标 | 多个视图文件中对 `#BA1A1A`、`C.red`、`AlertTriangle` 的一致使用 | 保证跨页面错误视觉一致性 |
| 错误不影响主流程推进，需提供“跳过错误行”选项 | `InsurerImport.tsx` 校验步骤提供对应按钮 | 允许部分失败场景下的增量导入 |
| 错误作为独立埋点命名空间上报 | `产品功能清单_V1.0.0.md` 中 `error` 命名空间 | 错误需纳入统一监控体系 |

## 5. 总结

该仓库的前端原型采用**“数据驱动的错误模型 + 视图层结构化展示”**的方式处理错误：错误被建模为普通对象、贯穿导入流程各步骤，并通过一致的视觉语言（红色、告警图标、表格）向用户呈现。它没有后端异常中间件、没有全局错误边界、也没有 panic/recover，因为这是一个纯 UI 原型，真正的错误传播将在后续接入后端 API 时另行实现。当前阶段的核心价值在于定义了错误数据的结构和用户在导入/校验场景中的错误处理交互范式。