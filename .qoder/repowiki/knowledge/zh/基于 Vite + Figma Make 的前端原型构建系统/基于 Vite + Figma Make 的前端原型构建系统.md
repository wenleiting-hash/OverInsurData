---
kind: build_system
name: 基于 Vite + Figma Make 的前端原型构建系统
category: build_system
scope:
    - '**'
source_files:
    - 产品设计/UI-V1.0/package.json
    - 产品设计/UI-V1.0/vite.config.ts
    - 产品设计/UI-V1.0/.figma/make/site.json
    - 产品设计/UI-V1.0/.figma/make/dev
    - 产品设计/UI-V1.0/.figma/make/deploy
    - 产品设计/UI-V1.0/.mise.toml
---

## 1. 使用的系统与工具

该仓库是一个纯前端 UI 原型项目（React + TypeScript + Tailwind CSS），构建系统围绕 **Vite** 构建器与 **Figma Make Kit** 生态组织：
- 构建器：`vite ^8.0.5`，通过 `@vitejs/plugin-react` 提供 React JSX/TSX 支持。
- 样式：`tailwindcss ^4.0.0` + `@tailwindcss/vite` 插件。
- 包管理器：`pnpm 10.34.3`，由 `.mise.toml` 锁定 Node 22 与 pnpm 版本。
- 开发体验：自定义 Vite 插件实现错误覆盖回放、React Refresh 边界回退、Storybook-like 的 `/.figma/make/kit.html` 路由等。
- 发布：`.figma/make/deploy` 脚本调用 `figma make deploy --build-dir dist`，将产物推送到 Figma Make 托管环境。

## 2. 关键文件

- `产品设计/UI-V1.0/package.json`：定义 `dev` / `build` / `preview` / `format` 四个 npm scripts；依赖 React 19、Recharts、Lucide React。
- `产品设计/UI-V1.0/vite.config.ts`：核心构建配置，包含站点元信息注入、robots.txt 生成、Google Analytics 注入、可访问性跳过链接、错误覆盖回放、React Refresh 边界回退、Figma Make Kit 虚拟路由等全部逻辑。
- `产品设计/UI-V1.0/.figma/make/site.json`：站点级配置（标题、描述、robots 策略、可访问性开关）。
- `产品设计/UI-V1.0/.figma/make/dev`：开发入口，执行 `pnpm run dev`。
- `产品设计/UI-V1.0/.figma/make/deploy`：部署入口，先 `pnpm run build` 再 `figma make deploy --build-dir dist`。
- `产品设计/UI-V1.0/.mise.toml`：声明 Node 22 + pnpm 10.34.3 的工具链版本。
- `产品设计/UI-V1.0/tsconfig.json`：TypeScript 编译配置。

## 3. 架构与约定

### 构建模式与环境变量
- `base` 路径通过环境变量 `FIGMA_PUBLIC_URL` 动态设置，默认 `/`，用于在 Figma 预览 iframe 中正确加载资源。
- Source map 行为按 mode 切换：`development` 模式输出 inline sourcemap，生产模式关闭并启用压缩。
- 开发服务器监听 `0.0.0.0:8443`（可通过 `PORT` 覆盖），且 `strictPort: true` 避免端口冲突。
- 开发时忽略 `**/.figma/**` 下的文件变更，避免触发不必要的 HMR。

### 站点元数据注入机制
`vite.config.ts` 中的 `figmaSiteConfiguration` 插件读取 `.figma/make/site.json`，在 `transformIndexHtml` 阶段替换 HTML 注释槽位（`figma:title`、`figma:lang`、`figma:head-start` 等），并按配置注入 `<meta>`、`<link rel="icon">`、Open Graph/Twitter Card 标签、Google Analytics 脚本以及可选的 robots.txt 静态资源。

### Figma Make 集成
- 通过 `figmaMakeKitPlugin` 在开发模式下提供 `/.figma/make/kit.html` 虚拟路由，扫描 `src/**/*.stories.{ts,tsx,js,jsx}` 并将故事模块注册到 `window.__FIGMA__.stories`，供 Figma 设计表面动态导入渲染。
- 该插件仅 `apply: 'serve'`，不会进入生产构建产物。
- 另有 `figmaErrorOverlayReplay` 拦截 WebSocket `ws.send`，缓存最近一次构建错误并在新连接时重放，解决预览 iframe 重新连接后错误覆盖消失的问题。
- `figmaReactRefreshBoundaryFallback` 检测组件模块是否丢失 React Refresh 边界（例如被改写为纯 re-export），必要时触发 `full-reload` 保证热更新生效。

### 脚本约定
- `pnpm run dev` → `vite --host 0.0.0.0`
- `pnpm run build` → `vite build`（产出 `dist/`）
- `pnpm run preview` → `vite preview`
- `pnpm run format` → `oxfmt`（代码格式化）
- 外部命令封装：`.figma/make/dev`、`.figma/make/deploy`、`.figma/make/install`、`.figma/make/format`、`.figma/make/deploy-preview`、`.figma/make/analyze-routes`、`.figma/make/langserver` 等 bash 脚本统一入口。

## 4. 约定与约束

- **工具链版本锁定**：`.mise.toml` 强制使用 Node 22 与 pnpm 10.34.3，确保本地与 CI 一致。
- **构建产物目录固定**：部署脚本硬编码 `--build-dir dist`，所有发布流程必须产出到 `dist/`。
- **开发端口固定**：默认 8443，通过 `PORT` 环境变量覆盖；`strictPort: true` 禁止自动换端口。
- **Figma 预览基路径**：通过 `FIGMA_PUBLIC_URL` 环境变量控制 `base`，部署到 Figma Make 时必须设置此变量。
- **源码别名**：`@` 指向 `./src`，组件与视图均通过绝对路径引用。
- **构建产物最小化**：非 development 模式开启 `minify`，关闭 sourcemap；development 模式启用 inline sourcemap 便于调试。
- **robots 策略**：`site.json` 中 `robots.index: false` 会同时注入 `<meta name="robots" content="noindex, nofollow">` 并生成 `robots.txt`。
- **无传统 CI/CD 文件**：仓库未包含 GitHub Actions、Jenkinsfile、Dockerfile 等，构建与发布完全依赖本地 `pnpm` 脚本与 `figma make` CLI。
- **无跨平台编译**：纯前端静态资源构建，不涉及多目标交叉编译或二进制打包。

总体而言，该项目采用“Vite + Figma Make”的一体化前端原型构建方案，构建配置高度集中在 `vite.config.ts`，并通过 `.figma/make/*.sh` 脚本和 `package.json` scripts 暴露标准开发/构建/部署接口。