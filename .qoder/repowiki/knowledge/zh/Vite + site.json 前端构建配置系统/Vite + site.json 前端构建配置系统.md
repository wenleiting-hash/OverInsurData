---
kind: configuration_system
name: Vite + site.json 前端构建配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - 产品设计/UI-V1.0/vite.config.ts
    - 产品设计/UI-V1.0/.figma/make/site.json
    - 产品设计/UI-V1.0/package.json
    - 产品设计/UI-V1.0/tsconfig.json
    - 产品设计/UI-V1.0/src/data/channelHierarchyData.ts
    - 产品设计/UI-V1.0/src/data/cooperationData.ts
    - 产品设计/UI-V1.0/src/data/financeData.ts
---

## 1. 使用的系统与工具

该仓库是一个纯前端原型项目（React + Vite + Tailwind），**没有后端服务、数据库或运行时配置加载逻辑**。其“配置系统”集中在构建期，由以下组件构成：
- **Vite 构建器**（`vite.config.ts`）作为唯一入口，通过 `defineConfig` 暴露开发/预览/生产三套行为。
- **JSON 站点配置**（`.figma/make/site.json`）描述站点元信息（标题、描述、robots、可访问性开关等），被 Vite 插件在构建时注入到 HTML。
- **环境变量**（`process.env.*`）用于覆盖端口、部署基路径等运行期参数。
- **TypeScript 编译配置**（`tsconfig.json`）定义模块解析、路径别名 `@/* → ./src/*`。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `产品设计/UI-V1.0/vite.config.ts` | 构建配置核心：插件链、HMR、HTML 注入、robots.txt 生成、Google Analytics 注入、Figma Make Kit 路由 |
| `产品设计/UI-V1.0/.figma/make/site.json` | 站点级 JSON 配置（title/description/robots/accessibility/analytics/icons/openGraph/customScripts） |
| `产品设计/UI-V1.0/package.json` | npm scripts（`dev`/`build`/`preview`/`format`），声明依赖与类型 |
| `产品设计/UI-V1.0/tsconfig.json` | TS 编译选项、`@/*` 路径别名、`resolveJsonModule` |
| `产品设计/UI-V1.0/src/data/channelHierarchyData.ts` | 包含 `WhiteLabelConfig` 接口及 `whiteLabelConfigs` 数组，是业务白标配置的静态数据源 |
| `产品设计/UI-V1.0/src/data/cooperationData.ts` | 包含 `SettlementConfig` 接口及 `settlementConfigs` 数组 |
| `产品设计/UI-V1.0/src/data/financeData.ts` | 包含 `SettlementCycleConfig` 接口及 `settlementCycles` 数组 |

## 3. 架构与约定

### 3.1 构建期配置分层
- **JSON 层**（`.figma/make/site.json`）：站点元数据、SEO、可访问性开关。通过自定义插件 `figmaSiteConfiguration` 读取，并在 `transformIndexHtml` 阶段替换 `<!-- figma:lang / figma:title / figma:head-start ... -->` 注释槽位，同时动态注入 `<meta>`、`<link>`、`<script>` 标签。
- **环境变量层**：`FIGMA_PUBLIC_URL` 决定 `base` 前缀；`PORT` 覆盖开发/预览端口（默认 `8443`）；`mode`（development/production）控制 sourcemap 与压缩。
- **代码层**：白标/结算周期等业务配置以 TypeScript 接口 + 常量数组形式硬编码在 `src/data/*.ts` 中，供视图直接消费。

### 3.2 插件化扩展点
`vite.config.ts` 注册了多个自定义插件，形成清晰的职责划分：
- `figmaSiteConfiguration`：把 `site.json` 注入 HTML。
- `figmaErrorOverlayReplay`：拦截 WS 消息，重放最近一次构建错误给新连接客户端。
- `figmaReactRefreshBoundaryFallback`：检测 React Refresh 边界丢失并触发 full-reload。
- `figmaMakeKitPlugin`：在 dev 模式提供 `/.figma/make/kit.html` 虚拟路由，扫描 `*.stories.*` 暴露给 Figma 预览。

### 3.3 安全与校验约定
- 所有来自 `site.json` 的字符串值经 `sanitizeHtmlValue` 过滤非 `[a-zA-Z0-9_-]` 字符后再写入 HTML。
- 文本内容经 `escapeHtmlText` 转义 `& < >` 后插入。
- `robots.index === false` 时同时输出 `/robots.txt` 和 `<meta name="robots" content="noindex, nofollow">`，双重抑制索引。

## 4. 约定与约束

- **配置来源优先级**：环境变量（`process.env.*`）优先于 `site.json` 默认值；`site.json` 中的可选字段均有 `??` 默认值，缺失不会导致构建失败。
- **仅构建期生效**：所有配置在 `vite build` 时固化进产物，运行时不加载外部配置文件（无 `.env` 文件、无 `dotenv` 依赖、无运行时 config 模块）。
- **路径别名**：通过 `tsconfig.json` 的 `paths` 与 `vite.config.ts` 的 `resolve.alias` 共同将 `@/*` 映射到 `./src/*`，确保 IDE 与构建一致。
- **Figma Make 集成**：`.figma/make/dev.json`、`deploy`、`deploy-preview` 等脚本配合 `--mode development` 走缓存预览流程，`site.json` 是 Figma Make 生态约定的站点配置入口。
- **业务配置静态化**：白标、结算周期等配置以 `interface + const array` 形式定义在 `src/data/` 下，未使用运行时配置中心或远程下发。

## 5. 不适用说明

本仓库不包含后端服务、API 网关、数据库或容器编排，因此不存在传统意义上的“运行时配置系统”（如 Spring `application.yml`、Kubernetes ConfigMap、环境变量注入中间件等）。上述构建期配置即为该项目中全部的配置相关实现。