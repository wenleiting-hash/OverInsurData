---
kind: dependency_management
name: 基于 pnpm + Vite 的前端依赖管理
category: dependency_management
scope:
    - '**'
source_files:
    - 产品设计/UI-V1.0/package.json
    - 产品设计/UI-V1.0/pnpm-lock.yaml
    - 产品设计/UI-V1.0/.mise.toml
---

## 1. 使用的系统/工具

该仓库是一个纯前端原型项目（Figma Make 应用），位于 `产品设计/UI-V1.0/` 目录下，采用 **pnpm** 作为包管理器，配合 **Vite 8** 构建与开发。Node.js 运行时版本通过 `.mise.toml` 锁定为 `22`，pnpm 版本锁定为 `10.34.3`，确保多环境一致。

- 包清单：`package.json`
- 精确锁文件：`pnpm-lock.yaml`（lockfileVersion 9.0）
- 运行时/工具链锁定：`.mise.toml`
- 无私有 npm registry、无 `.npmrc`、无 `vendor/` 目录——所有依赖均从公共 npm 源获取。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `产品设计/UI-V1.0/package.json` | 声明生产依赖（react、react-dom、recharts、lucide-react）与开发依赖（vite、typescript、tailwindcss、@types/*、oxfmt 等） |
| `产品设计/UI-V1.0/pnpm-lock.yaml` | 锁定每个依赖的精确版本及子依赖树，包含 integrity hash，保证安装可重现 |
| `产品设计/UI-V1.0/.mise.toml` | 声明 Node 22 与 pnpm 10.34.3，供 mise 工具链管理器统一安装 |
| `产品设计/UI-V1.0/node_modules/` | pnpm 安装的依赖目录（含 `.pnpm-workspace-state-v1.json` 工作区状态） |

## 3. 架构与约定

- **依赖分类明确**：运行时代码仅依赖 `react`、`react-dom`、`recharts`、`lucide-react`；构建期工具（vite、typescript、tailwindcss、@vitejs/plugin-react、@tailwindcss/vite、@types/*、oxfmt）全部放入 `devDependencies`，不进入产物。
- **语义化版本范围**：`package.json` 中所有依赖使用 `^` 前缀的 caret 范围（如 `^19.0.0`、`^8.0.5`、`^3.10.1`），允许小版本自动升级；实际固定版本由 `pnpm-lock.yaml` 决定。
- **锁文件纳入版本控制**：`pnpm-lock.yaml` 随代码提交，是团队安装依赖的唯一权威来源，避免“在我机器上能跑”的问题。
- **Node/pnpm 版本通过 mise 锁定**：`.mise.toml` 使新加入开发者可通过 `mise install` 一键获得匹配的 Node 与 pnpm 版本，减少环境差异。
- **无 vendoring / 私有源**：未发现 `.npmrc`、`registry=` 配置或 `vendor/` 目录，所有第三方包均来自公共 npm registry。

## 4. 约定与约束

- **新增依赖必须同时更新 `package.json` 并通过 `pnpm install` 生成/同步 `pnpm-lock.yaml`**：pnpm 的 lockfile 机制要求变更清单后重新生成锁文件，否则 CI 或他人安装会失败。
- **禁止手动编辑 `pnpm-lock.yaml`**：应通过 `pnpm add <pkg>` / `pnpm up` 等命令维护，以保证 integrity hash 与依赖图一致性。
- **Node 与 pnpm 版本不得随意更改**：`.mise.toml` 中锁定的 `node = "22"` 和 `"npm:pnpm" = "10.34.3"` 是硬性约束，切换版本需先修改该文件。
- **生产依赖最小化**：当前仅保留 UI 渲染所需的最小集合（React 19、Recharts 图表、Lucide 图标），构建工具一律放在 devDependencies，符合前端最佳实践。
- **格式化/类型检查作为开发依赖**：`oxfmt` 用于代码格式校验，`typescript` 与 `@types/react(-dom)` 提供类型支持，这些工具不参与最终产物打包。