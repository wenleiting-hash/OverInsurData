---
name: feature-scaffold
description: Scaffolds UI prototype views from the operation-level feature list of the Overseas Insurance Digital Platform. Generates view component, mock data file, ViewId registration, sidebar nav entry and i18n key placeholders following UI-V1.0 conventions. Use when the user references a feature point number (e.g. "7.6 代理人新增", "11.3 阶梯佣金配置"), asks to implement/scaffold a feature from 产品功能清单, or wants to turn a requirement section into a prototype page.
---

# Feature Scaffold（功能点脚手架）

将 `产品需求/产品功能清单_V1.0.0.md` 中的操作级功能点转换为 `产品方案/UI-V1.0` 原型中的可交互视图。

## 输入识别

用户输入通常为以下形式之一：
- 功能点编号：`7.6`、`十一.3`、`12.7 退保追回处理`
- 功能名称：`代理人新增`、`佣金方案编辑`
- 子模块名：`渠道入驻与准入管理`（生成该子模块下的多个功能点）

**第一步**：在 `产品需求/产品功能清单_V1.0.0.md` 中定位对应章节，提取：
1. 功能描述（作为页面副标题/说明）
2. 操作清单表格（每个操作 → 一个按钮/交互/列）

## 生成步骤（检查清单）

```
- [ ] 1. 定位功能点，提取功能描述与操作清单
- [ ] 2. 判断视图类型（列表/详情/表单/看板/配置）
- [ ] 3. 检查 ViewId 是否已存在于 Sidebar，避免重复
- [ ] 4. 生成/更新 mock 数据文件
- [ ] 5. 生成视图组件
- [ ] 6. 注册路由（ViewId + App.tsx + Sidebar）
- [ ] 7. 移除 PlaceholderView 中的占位项（如适用）
- [ ] 8. 登记 i18n key 占位清单
```

## 关键约定（必须遵守）

### 文件位置
- 视图组件：`产品方案/UI-V1.0/src/views/{PascalCaseName}.tsx`
- Mock 数据：`产品方案/UI-V1.0/src/data/{camelCaseDomain}Data.ts`（按业务域归并，已有：mockData/appointment/channel/cooperation/finance/insurer/onboarding/product 等）
- 弹窗组件：`产品方案/UI-V1.0/src/components/{Name}Modal.tsx`

### 路由注册（三处联动，缺一不可）
1. `src/components/Sidebar.tsx`：`ViewId` 联合类型追加新 ID；对应 `navGroups` 分组的 `items` 追加 `{ id, label, icon }`（icon 用 `lucide-react`，尺寸 `size={15}`）
2. `src/App.tsx`：`import` 新组件 + `renderView()` switch 追加 case
3. 若该 ViewId 原在 `PlaceholderView.tsx` 的 `VIEW_INFO` 中，删除占位项

### 组件签名约定
```tsx
interface Props {
  navigateTo: (view: ViewId, params?: { insurerId?: string; productId?: string }) => void
}
export default function XxxView({ navigateTo }: Props) { ... }
```
- 详情页额外接收实体 ID prop（如 `insurerId`）
- 表单页用 `mode: 'create' | 'edit'` prop 区分新增/编辑

### 设计令牌（与现有视图一致）
| 用途 | 值 |
|---|---|
| 页面标题 | `fontSize: 20, fontWeight: 700, color: '#181C23'` |
| 副标题/说明 | `fontSize: 13, color: '#717786'` |
| 主色（按钮/链接/高亮） | `#0058BC`，浅底 `rgba(0,88,188,0.07)` |
| 卡片 | `className="card"`（全局样式已定义） |
| 容器 | `maxWidth: 1440, margin: '0 auto'` |
| 图标 | `lucide-react` |

### 页面布局规范
- 搜索区与列表区必须用独立卡片容器分隔：搜索区无投影白色卡片，列表区 `shadow-sm` 轻投影
- 列表页标配：搜索/筛选栏 + 操作按钮（对应功能点的操作）+ 表格 + 分页
- 详情页标配：头部信息卡 + Tab 或分区卡片（关联数据、变更记录等）

## 操作清单 → UI 映射规则

| 操作类型（操作说明关键词） | UI 呈现 |
|---|---|
| 新增/创建 | 主按钮（蓝色实心）+ 抽屉/全屏表单 |
| 编辑/修改 | 表格行操作 + 复用表单（mode="edit"） |
| 停用/启用/终止/暂停 | 行操作 + 确认弹窗（需填原因） |
| 删除 | 行操作 + 二次确认 |
| 筛选/搜索/排序 | 搜索区卡片内控件 |
| 批量操作 | 表格多选 + 批量操作栏 |
| 导入 | 上传弹窗（模板下载→上传→预览→校验→结果反馈四步） |
| 导出 | 按钮 + 导出范围/字段/格式选择弹窗 |
| 查看/展示 | 详情页分区或表格列 |
| 审批 | 待审批列表 + 通过/驳回操作 |
| 预览/模拟 | 输入参数 → 展示计算结果的抽屉 |

## Mock 数据约定

```typescript
// data/{domain}Data.ts
export interface XxxRecord {
  id: string
  // 字段名 camelCase，与需求中的业务字段对应
  status: string        // 状态字段用英文常量（如 'ACTIVE' | 'SUSPENDED'）
  createdAt: string     // ISO 日期字符串
}
export const xxxRecords: XxxRecord[] = [ /* 5-10 条，覆盖各状态分支 */ ]
```
- 数据量：列表 5-10 条，覆盖全部状态枚举值，便于原型演示各分支
- 金额用数字（美元），日期用 `'2026-08-29'` 格式
- 实体名称贴近美国保险市场真实语境（如 "State Mutual Insurance"、"Pacific Crest Agency"）

## i18n key 登记

生成视图后，在交付说明中列出本视图涉及的 i18n key 占位清单，格式：
```
命名空间:模块.字段.描述
示例：channel:onboarding.list.title / channel:onboarding.action.approve
```
命名空间映射：保险公司域→carrier、渠道域→channel、佣金域→commission、财务域→finance、通用→common、错误→error。

## 交付物

每次脚手架完成后汇报：新增/修改的文件清单、注册的 ViewId、对应的功能点编号、i18n key 清单。不要运行构建命令，除非用户要求。
