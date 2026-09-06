# WorkforceOS UI 设计规范

> 版本：v1.0
> 日期：2026-08-21
> 适用范围：WorkforceOS Workbench（Desktop 优先）及各端原型、管理表面
> 权威来源：`workforceos/stitch_spatial_workforce_shell/workforceos_spatial_design_system/DESIGN.md`
> 配套参考：`.agents/skills/*-design-guidelines`（各平台官方设计准则）、`macOS 27 (Community).fig`、`ChatGPT UI Kit.fig`
> 说明：本规范整理自现有设计系统文档与原型实现约定，供设计还原、原型迭代与前端实现统一遵循；不替代尚未闭合的产品决定。

---

## 1. 设计理念

### 1.1 设计运动：Spatial Glassmorphism（空间玻璃拟态）

WorkforceOS 的视觉语言建立在 **"Spatial Productivity"（空间生产力）** 叙事之上：

- **结构来源**：macOS 的桌面结构 + visionOS 的环境纵深感
- **品牌个性**：直观（Intuitive）、沉浸（Immersive）、专注（Focused）
- **情感目标**：让复杂 AI 驱动的工作流感觉轻盈且具有物理存在感，用户感受到的是 **"calm control"（从容掌控）**——AI 不是盒子里的工具，而是共享用户物理空间的协作伙伴

### 1.2 四条核心原则

| 原则 | 含义 |
| --- | --- |
| 环境融合 | 用磨砂玻璃（vibrancy）让 UI 成为用户工作空间的自然延伸 |
| Z 轴层级 | **深度即导航**：离用户越近的元素越亮越实，背景元素以更高透明度和模糊度退后 |
| 触觉柔软 | 所有边缘圆角化，交互以柔和阴影与微光高光缓冲，模拟物理光的折射 |
| 简化聚焦 | 仅提供 Light Mode，以 "Frosted White" 与 "Mist Grey" 降低高认知负荷任务的负担 |

---

## 2. 设计令牌（Design Tokens）

### 2.1 色彩

色彩体系基于 **Dynamic Materials（动态材质）** 而非静态色板。所有实现必须通过 CSS 变量引用，禁止硬编码 hex。

#### 核心表面色

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `background` / `surface` | `#F9F9FF` | 背景基色 |
| `surface-dim` | `#D8D9E5` | 暗表面 |
| `surface-container-lowest` | `#FFFFFF` | 最浅容器 |
| `surface-container-low` | `#F1F3FE` | 浅容器 |
| `surface-container` | `#ECEDF9` | 标准容器 |
| `surface-container-high` | `#E6E8F3` | 较深容器 |
| `surface-container-highest` | `#E0E2ED` | 最深容器 |
| `on-surface` | `#181C23` | 表面主文字 |
| `on-surface-variant` | `#414755` | 表面次级文字 |
| `outline` | `#717786` | 描边 |
| `outline-variant` | `#C1C6D7` | 弱描边 |

#### 功能色

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `primary` | `#0058BC` | 主色（蓝） |
| `primary-container` | `#0070EB` | 主色容器 |
| `on-primary` | `#FFFFFF` | 主色上文字 |
| `inverse-primary` | `#ADC6FF` | 反色主色 |
| `surface-tint` | `#005BC1` | 表面着色 |
| `secondary` | `#006687` | 次色（青蓝） |
| `secondary-container` | `#60CDFF` | 次色容器 |
| `tertiary` | `#9E3D00` | 第三色（橙棕） |
| `tertiary-container` | `#C64F00` | 第三色容器 |
| `error` | `#BA1A1A` | 错误 |
| `error-container` | `#FFDAD6` | 错误容器 |

#### 玻璃材质色

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `glass-background` | `rgba(255,255,255,0.4)` | 玻璃面板底色（40–60% 白） |
| `glass-stroke` | `rgba(255,255,255,0.5)` | 玻璃面板 0.5px 内描边 |
| `vibrancy-primary` | `rgba(0,0,0,0.85)` | 玻璃面主文字 |
| `vibrancy-secondary` | `rgba(0,0,0,0.55)` | 玻璃面次级文字 |

#### 状态色（Light Orbs 专用）

| 令牌 | 值 | 语义 |
| --- | --- | --- |
| `status-action` | `#FF3B30` | 轮到你了（需用户行动），带外发光 |
| `status-running` | `#AF52DE` | 正在忙活（进行中） |
| `status-active` | `#34C759` | 刚出炉（新结果） |
| `status-pending` | `#FFCC00` | 默默运行中（后台） |

### 2.2 字体与排版

- **西文字体**：SF Pro Display（标题类）/ SF Pro Text（正文类）
- **中文回退**：PingFang SC，字重与 SF Pro 规格对齐；中文在玻璃面上需**略增字距**
- **玻璃面可读性铁律**：所有渲染在玻璃表面上的文字必须使用 vibrancy 效果，不使用静态灰色

| 层级 | 字体 | 字号 | 字重 | 行高 |
| --- | --- | --- | --- | --- |
| display-lg | SF Pro Display | 34px | 700 | 41px |
| headline-md | SF Pro Display | 24px | 600 | 30px |
| title-sm | SF Pro Text | 20px | 600 | 25px |
| body-lg | SF Pro Text | 17px | 400 | 22px |
| body-sm | SF Pro Text | 15px | 400 | 20px |
| label-bold | SF Pro Text | 13px | 600 | 18px |
| label-sm | SF Pro Text | 12px | 400 | 16px |

对齐规则：中心对话区使用标准阅读对齐；Ornaments 与侧栏标签在其 60pt 容器内垂直居中。

### 2.3 圆角

| 令牌 | 值 | 适用 |
| --- | --- | --- |
| sm | 4px (0.25rem) | 细小组件 |
| DEFAULT | 8px (0.5rem) | 常规控件 |
| md | 12px (0.75rem) | 中等容器 |
| lg | 16px (1rem) | 卡片与对话气泡 |
| xl | 24px (1.5rem) | 大容器 |
| 窗口级 | 40px (xl+) | 主窗口外层 |
| full | 9999px | 按钮圆形 / Squircle |

### 2.4 间距

| 令牌 | 值 | 说明 |
| --- | --- | --- |
| target-min | **60pt** | 所有可交互元素最小命中目标 |
| gutter-md | 1.5rem | 栏间距 |
| margin-edge | 2rem | 边缘留白 |
| Session Rail 宽度 | 44–60pt | 次级竖栏 |

---

## 3. 材质与深度（Elevation）

### 3.1 玻璃材质

- **System Glass**：半透明白底（40–60% 不透明度）+ 大半径背景模糊
- **模糊度规则**：主窗口 `backdrop-filter: blur(30px~50px)`；浮层/Ornaments `blur(20px)`
- **描边规则**：所有玻璃面板统一 `0.5px` 白色内描边（`glass-stroke`），用于在复杂背景上界定边缘

### 3.2 Z 轴四级层级

| 层级 | 名称 | 规则 |
| --- | --- | --- |
| Level 0 | Background | 环境"世界"，透过 UI 可见 |
| Level 1 | Main Windows | 厚玻璃 blur(30px)；Workbench、Work Surface |
| Level 2 | Ornaments & Overlays | 薄玻璃 blur(20px)；向主窗口投柔和漫射环境阴影 |
| Level 3 | Interactive Hover | 凝视/悬停触发 "Specular Highlight"：左上边缘内发光 + 1.02x 微缩放 |

### 3.3 阴影规则

阴影**禁止纯黑**，必须带环境平均色调，以维持玻璃错觉的连续性。

---

## 4. 形状语言（Geometric-Organic）

- **窗口**：大圆角 40px（xl+），柔软亲和
- **卡片与气泡**：16px（lg），现代友好
- **交互目标**：按钮与 Ornament 项常用圆形或 **Squircle（连续曲率）**，对齐 visionOS 硬件美学
- **边框**：玻璃面板统一 0.5px 白色内描边

---

## 5. 布局规范（Spatial Hybrid Grid）

2D 界面使用标准边距，3D 摆放遵循用户中心舒适区。

### 5.1 60pt 规则

每个可交互元素（按钮、标签页、列表项）最小命中目标 **60pt**，兼容眼动追踪与手捏合（Pinch）手势。所有组件内部按钮同样遵守。

### 5.2 结构分区

| 区域 | 位置 | 规则 |
| --- | --- | --- |
| 全局导航（Ornaments） | 左侧，**主窗口之外的浮动玻璃容器** | Logo + 主要目的地（工作台、知识库）；图标使用 SF Symbols，置于 60pt 圆形中心 |
| Session Rail | 全局导航与中心对话区之间 | 44–60pt 宽的次级竖栏 |
| 中心对话区 | 主窗口中央 | 标准阅读对齐；输入框为居中大号玻璃胶囊 |
| 底部工具栏（Ornaments） | 底部，主窗口之外的浮动玻璃容器 | 当前 Work Surface 的上下文操作 |
| Workline Sidebar | 右侧，可折叠 | 折叠后必须保留"把手"或幽灵痕迹（ghost-trace）提示可拉回 |

---

## 6. 组件规范

### 6.1 对话气泡（Dialogue Bubbles）

| 角色 | 对齐 | 材质 |
| --- | --- | --- |
| 用户 | 右对齐 | 略更不透明的玻璃 |
| AI | 左对齐 | 更轻的玻璃 + 微妙 vibrancy 色调，以区分人格 |

### 6.2 Review Cards（行内交互卡片）

聊天流中的行内交互组件；其内部所有按钮遵守 60pt 目标规则。

### 6.3 Workline Sidebar 条目

- 结构：`[Light Orb] + 标题 + 状态文本`
- 状态：悬停（凝视）高亮背景；Pinch 手势触发进入 Workline

### 6.4 输入框（The Dialogue Hub）

- 大型居中玻璃胶囊，视觉上需有"分量感"以标示首要界面地位
- 聚焦态：边框光晕增强，周围环境微微变暗（沉浸聚焦），优先保证文字输入

### 6.5 Work Surface 容器

重编辑器（PPT、研究浏览器等）占据 "Front Stage"：使用**更不透明的材质**保证内容（文字、图片）完全可读，外框（bezel）保持半透明。

---

## 7. 状态与反馈

### 7.1 Light Orbs 状态系统

状态一律通过发光小圆点表达，禁止仅用文字或灰色图标传达状态：

| 状态 | 颜色 | 视觉 |
| --- | --- | --- |
| 轮到你了（Action Required） | 亮红 `#FF3B30` | 带外发光 |
| 正在忙活（In Progress） | 紫 `#AF52DE` | — |
| 刚出炉（New Result） | 绿 `#34C759` | — |
| 默默运行中（Background） | 琥珀 `#FFCC00` | — |

### 7.2 交互反馈

- 悬停/凝视：背景高亮 + Level 3 高光（左上内发光 + 1.02x 缩放）
- 所有交互以柔和阴影与微光缓冲，模拟物理光折射，禁止生硬的状态跳变

---

## 8. 独立子系统：PPT 生成器（例外体系）

`ppt-system/ppt-generator` 服务于汇报导出场景，**不适用玻璃拟态**，使用独立视觉体系：

| 项 | 规范 |
| --- | --- |
| 主色 | Bain 咨询风品牌红 `#C00000`，配套 chart-red 100–900 渐变 |
| 字体 | Arial → Helvetica Neue → Helvetica → sans-serif |
| 圆角 | 保守：sm 2px / md 4px / lg 8px |
| 画布 | 固定 1920×1080（`.ppt-canvas`），无移动端适配 |
| 打印 | `@media print` 隐藏控制按钮 |

该体系与主设计语言不得混用。

---

## 9. 工程实现约定

### 9.1 样式管理

1. 新页面/组件**必须通过 CSS 变量引用主题色**（复用 `--surface-*`、`--text-*`、`--selection-strong` 等），禁止硬编码 hex 值
2. 所有原型通过 `:root` CSS 变量集中管理颜色、阴影、圆角、字体
3. 原型样式按版本化命名空间隔离：`.pb33-*`、`.pb34-*`……每版独立前缀，禁止互相污染
4. Shell 结构类名沿用 BEM 风格：`.lnav`（左导航）、`.wl-sidebar`（工作线侧栏）、`.wb-main`（工作台主体）、`.msg.u`（用户消息气泡）、`.acard`(待确认卡片)
5. 玻璃面板统一使用 `backdrop-filter`：主窗口 30–50px，浮层 20px

### 9.2 图标

使用 **SF Symbols** 语义图标，置于 60pt 圆形容器中；Web 端实现需以等效语义图标集替代并保持尺寸规则。

---

## 10. 禁止事项清单

1. ❌ 硬编码颜色 hex 值绕过 CSS 变量
2. ❌ 玻璃表面使用静态灰色文字（必须 vibrancy）
3. ❌ 纯黑阴影
4. ❌ 小于 60pt 的可交互目标
5. ❌ 用文字/普通图标替代 Light Orbs 表达状态
6. ❌ 增加 Dark Mode（当前规范仅 Light Mode）
7. ❌ 主设计语言与 PPT 咨询风体系混用
8. ❌ 跨版本复用 `.pbXX-*` 前缀样式造成污染
9. ❌ Workline Sidebar 折叠后不留任何可拉回提示

---

## 11. 现状与演进

- 当前处于**设计系统文档 + 多套 HTML/CSS 原型 + Figma 稿**阶段，尚无生产级前端代码与统一组件库
- 后续进入开发时：以本规范与 DESIGN.md 为权威，将 frontmatter 令牌映射为统一 Design Token 层，把 `.pbXX-*` 原型样式逐步迁移为可复用组件样式
- 本规范变更需同步更新 DESIGN.md 与各平台 design-guidelines skill 的使用方式，保持单一权威来源
