# 🚀 海外保险数字化平台 (Overseas Insurance Digital Platform) - V2.0

一个支持保险公司管理和渠道管理的国际化数字平台，采用 Monorepo 架构设计。

## 📂 项目结构

```
insurance-platform/                  ← 💻 代码根目录
├── apps/                            # 前端应用（可执行 SPA）
│   ├── web-carrier-admin/          # 保险公司管理后台（Phase 0-P0 Sprint ✅）
│   └── web-channel-admin/          # 渠道门户（待开发）
├── services/                        # 后端服务（NestJS 模块化单体）
│   ├── carrier-service/            # 保险公司管理服务（待开发）
│   ├── channel-service/            # 渠道管理服务（待开发）
│   └── commission-engine/          # 佣金计算引擎（待开发）
├── packages/                        # 共享包（npm 可发布或内部引用）
│   ├── ui/                         # UI 组件库（待开发）
│   ├── i18n/                       # 国际化工具（待开发）
│   └── shared-types/               # TypeScript 类型定义（待开发）
├── public/                          # 静态资源
│   └── locales/                     # 翻译语言包
│       ├── en-US/common.json
│       └── zh-CN/common.json
├── seed-data/                       # 数据库初始化数据（待填充）
├── package.json                     # root package.json（pnpm workspace）
├── pnpm-workspace.yaml             # Monorepo 工作区配置
└── README.md                       # 本文档
```

## 🎯 核心功能

- ✅ **双模式部署**：独立部署 / 集成平台模式切换
- ✅ **PostgreSQL 15 + Drizzle ORM**: 统一管理与部署
- ✅ **国际化框架**：English / Chinese 实时切换
- ✅ **Glassmorphism 设计系统**：现代化 UI 体验
- ✅ **模块化单体起步**：渐进式微服务架构

## 🛠️ 技术栈

### 前端
- **框架**: React 19 + TypeScript 5.7
- **构建工具**: Vite 5
- **样式**: Tailwind CSS v4
- **路由**: React Router v7
- **国际化**: react-i18next + i18next（en-US / zh-CN）
- **图标**: Lucide React

### 后端（Plan Phase 1）
- **运行环境**: Node.js 20
- **Web 框架**: NestJS + Fastify
- **ORM**: Drizzle ORM
- **认证**: JWT（短时效 access token + refresh token）
- **消息队列**: Apache Kafka（保单事件、佣金计算任务）

### 数据库
- **主数据库**: PostgreSQL 15
- **迁移管理**: Drizzle Migrate
- **缓存**: Redis 7

## 🚦 快速开始

### 前置条件

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+（可选，用于本地开发）

### 安装依赖

```bash
cd insurance-platform
pnpm install
```

### 启动开发服务器

```bash
# 启动保险公司管理后台（端口 3001）
pnpm dev:carrier

# 启动渠道门户（端口 3000，未来开发）
pnpm dev:channel
```

然后打开浏览器访问 http://localhost:3001

### 构建生产版本

```bash
pnpm build:carrier
pnpm build:channel
```

## 🌐 国际化支持（i18n）

本项目已实现完整的中英文双语支持：

- **当前页面语言**: 点击 TopBar 右上角按钮切换（🇨中文 / 🇺🇸English）
- **持久化存储**: 选择后保存在 `localStorage`，刷新保持
- **Key 命名规范**: `namespace:module.field.description`
- **扩展指南**: 在 `public/locales/en-US` 和 `public/locales/zh-CN` 添加翻译文件

### 示例：添加新翻译 Key

1. 编辑 `public/locales/en-US/common.json`:
```json
{
  "myModule": {
    "newKey": "New Key in English"
  }
}
```

2. 编辑 `public/locales/zh-CN/common.json`:
```json
{
  "myModule": {
    "newKey": "新的 Key 的中文翻译"
  }
}
```

3. 在组件中使用：
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('myModule.newKey')}</h1>;
}
```

## 📊 已完成里程碑（Phase 0-P0 Sprint）

- ✅ Monorepo 脚手架搭建（pnpm workspace）
- ✅ 国际化框架集成（react-i18next）
- ✅ 中英文语言包创建（~200 keys）
- ✅ Layout 组件（Sidebar + TopBar）
- ✅ Dashboard KPI Cards
- ✅ Glassmorphism 设计系统

## 📅 下一步计划（Phase 1）

- [ ] Insurer List CRUD 页面
- [ ] React Hook Form + Zod Schema 表单验证
- [ ] NestJS 模块化单体后端骨架（carrier-service/channel-service）
- [ ] Drizzle ORM Database Schema 定义
- [ ] PostgreSQL 15 本地开发环境
- [ ] API 客户端封装（Axios）
- [ ] 状态管理集成（Zustand）

## 🔗 相关文档

- **技术方案**: [技术实现方案 V2.0](../technical-solution/技术实现方案_V2.0.md)
- **数据库设计**: [数据库设计方案 V2.0](../technical-solution/数据库设计方案_V2.0.md)
- **UI 原型**: [产品方案/UI-V1.0](../product-solution/UI-V1.0/)
- **需求文档**: [产品功能清单 V1.0.0](../product-requirements/产品功能清单_V1.0.0.md)

## 👥 团队配置建议

| 角色 | 人数 | 职责 |
|---|---|---|
| 前端工程师 | 3-4 | 管理后台、渠道门户、组件库、i18n |
| 后端工程师 | 5-6 | 业务服务、佣金引擎、合规引擎、集成 |
| DevOps | 1-2 | 云资源、CI/CD、监控、安全 |
| 测试工程师 | 2-3 | 功能/接口/性能测试、自动化 |

## ⚠️ 注意事项

- 本项目使用 pnpm monorepo 管理，请勿使用 npm/yarn 命令
- PostgreSQL 数据库必须升级到 15+ 版本以支持 JSONB 查询
- 国际化是 P0 级要求，所有文案必须通过 i18n 框架获取

## 📄 License

Copyright © 2026 Overseas Insurance Digital Platform. All Rights Reserved.
