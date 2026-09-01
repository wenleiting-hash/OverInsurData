---
kind: frontend_style
name: 基于 Tailwind CSS v4 + Figma Make 的 Glassmorphism 设计系统
category: frontend_style
scope:
    - '**'
source_files:
    - 产品设计/UI-V1.0/src/index.css
    - 产品设计/UI-V1.0/vite.config.ts
    - 产品设计/UI-V1.0/package.json
    - 产品设计/UI-V1.0/.figma/make/site.json
    - 产品设计/UI-V1.0/src/components/Sidebar.tsx
    - 产品设计/UI-V1.0/src/components/TopBar.tsx
    - 产品设计/UI-V1.0/src/views/Dashboard.tsx
---

## 1. 技术栈与工具

- **框架**：React 19 + TypeScript，构建工具为 Vite 8。
- **样式方案**：Tailwind CSS v4（`@tailwindcss/vite`），通过 `@import 'tailwindcss'` 在 `src/index.css` 中引入，并使用 Tailwind v4 的 `@theme` 块集中声明设计令牌。
- **图标库**：`lucide-react`，所有组件中的图标统一来自该库。
- **图表库**：`recharts`，用于 Dashboard 等数据可视化页面。
- **字体**：通过 Google Fonts 引入 `Inter`（正文）和 `JetBrains Mono`（数据/数值），并在 `--font-sans` / `--font-mono` 中注册。
- **Figma Make 集成**：项目由 `.figma/make/site.json` 驱动，Vite 配置中包含多个自定义插件（`figmaSiteConfiguration`、`figmaErrorOverlayReplay`、`figmaReactRefreshBoundaryFallback`、`figmaMakeKitPlugin`），使原型可在 Figma 设计器内预览。

## 2. 核心文件

- `产品设计/UI-V1.0/src/index.css`：全局样式入口，定义 `@theme` 设计令牌、CSS 变量、Glassmorphism 类、按钮/表格/徽章等基础 UI 原子类。
- `产品设计/UI-V1.0/vite.config.ts`：Vite 构建配置，启用 Tailwind v4 插件、React 插件及 Figma Make 专用插件。
- `产品设计/UI-V1.0/package.json`：依赖声明，确认 Tailwind v4、React 19、Lucide、Recharts 等关键包。
- `产品设计/UI-V1.0/.figma/make/site.json`：站点元信息（标题、描述、robots、可访问性开关）。
- `产品设计/UI-V1.0/src/components/Sidebar.tsx`、`TopBar.tsx`：侧边栏与顶部栏，使用共享的 `glass`、`nav-item`、`btn-ghost` 等类。
- `产品设计/UI-V1.0/src/views/Dashboard.tsx`：主仪表盘示例，展示 KPI 卡片、图表、表格、状态徽标等典型视图组合。

## 3. 架构与设计约定

### 设计令牌（Design Tokens）
所有颜色、字号、圆角均通过 Tailwind v4 的 `@theme` 块集中管理：
- 色彩体系：`primary` (#0058BC)、`secondary` (#006687)、`tertiary` (#9E3D00) 为主色；`surface` 系列（surface/surface-dim/surface-low/surface-container/surface-high/surface-highest）提供层级背景；`on-surface` / `on-surface-var` 控制前景文本；`outline` / `outline-var` 控制边框；`error`、`status-action`、`status-running`、`status-active`、`status-pending` 表达状态语义。
- 字体：`--font-sans = Inter`，`--font-mono = JetBrains Mono`。
- 圆角：`xs(4px)` → `sm(8px)` → `md(12px)` → `lg(16px)` → `xl(24px)` → `2xl(32px)`。

### Glassmorphism 视觉风格
全局通过 CSS 变量实现毛玻璃效果：
- `--glass-bg` / `--glass-bg-strong` / `--glass-bg-light` 三种透明度级别。
- `--glass-stroke` 半透明边框，`--glass-shadow` / `--glass-shadow-elevated` 两级阴影。
- 页面背景 `--page-bg` 使用多层径向渐变营造光晕氛围。
- 通用类 `.glass`、`.glass-strong`、`.glass-light` 直接复用这些变量。

### 组件级原子类
`index.css` 定义了可直接复用的 UI 原子类，被各组件以 className 形式直接使用：
- 导航：`.nav-item`、`.nav-sub-item`、`.active` 态。
- 标签页：`.tab-bar`、`.tab-item`。
- 数据表：`.data-table`（含 th/td 样式、hover 行高亮）。
- 徽章：`.badge` 及 `.badge-blue/green/yellow/red/gray/purple/orange` 变体。
- KPI 卡片：`.kpi-card`（带 hover 浮起动效）。
- 输入：`.input-glass`（含 focus ring）。
- 按钮：`.btn-primary`、`.btn-secondary`、`.btn-ghost`。
- 容器：`.card`。
- 状态指示点：`.orb` 及多色变体。

### 布局与响应式策略
- 使用 Tailwind 原子类进行布局（如 `flex`、`grid`、`shrink-0`、`overflow-hidden`、`h-screen`），未看到媒体查询或断点定制，属于以原子类为主的轻量响应式。
- 整体采用固定宽度侧边栏（Sidebar 中硬编码 `width: 224`）+ 弹性内容区的经典后台布局。

### 组件组织
- `components/` 存放跨视图复用的 UI 构件（Sidebar、TopBar、各类 Modal）。
- `views/` 按业务视图拆分（Dashboard、InsurerList、ProductForm 等）。
- `data/` 存放 mock 数据，供原型演示。
- 组件内部大量使用 inline style 配合 className 的方式，对动态值（尺寸、颜色、间距）使用 style，对可复用样式使用 className。

## 4. 约定与约束

- **颜色必须走 `@theme` 令牌**：所有主题色通过 `--color-*` 变量暴露，组件中直接引用这些变量或使用对应 Tailwind 类名，避免散落硬编码色值。
- **统一使用 Lucide 图标**：所有图标均来自 `lucide-react`，禁止自行绘制 SVG。
- **Glassmorphism 是默认视觉语言**：面板、卡片、模态框普遍使用 `.glass` / `.glass-strong` / `.card` 类，保持统一的毛玻璃质感。
- **状态语义化配色**：成功/警告/错误/进行中分别使用 `status-active`、`status-pending`、`status-action`、`status-running` 对应的颜色。
- **数据列使用等宽字体**：数值、代码、指标列通过 `font-data` 或内联 `fontFamily: 'JetBrains Mono'` 保证对齐一致。
- **交互反馈统一**：按钮、卡片、导航项均有 120–160ms 的 transition，hover 时产生轻微位移或阴影提升，形成一致的微交互节奏。
- **构建产物受 Figma Make 控制**：通过 `.figma/make/site.json` 注入 title、description、robots、Open Graph 等 meta，生产构建会禁用 sourcemap 并压缩，开发模式开启 inline sourcemap 与 React Refresh 边界回退逻辑。

## 5. 适用性说明

本仓库是一个基于 Figma Make 的前端原型项目，使用 Tailwind CSS v4 + React + TypeScript 构建了完整的 Glassmorphism 风格 UI 系统，具备明确的设计令牌、组件原子类和视觉规范，因此 `frontend_style` 类别完全适用。