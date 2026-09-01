# Overseas Insurance Digital Platform - V2.0 项目概述

这是一个支持保险公司管理和渠道管理的国际化数字平台。

## 📁 目录结构

```
OverInsurData/                     ← 📂 项目根目录（工作区）
├── insurance-platform/            ← 💻 代码目录（Monorepo 脚手架）✨
│   ├── apps/                      # 前端应用（Vite + React）
│   ├── services/                  # 后端服务（NestJS）
│   ├── packages/                  # 共享包（UI/i18n/类型定义）
│   └── ...                        # 配置文件、静态资源等
│
├── product-solution/              # 🎨 UI 原型设计
│   └── UI-V1.0/                   # React 前端原型（独立开发阶段）
│
├── product-requirements/          # 📋 产品需求文档
│   ├── 产品功能清单_V1.0.0.md     # 41+86 功能点矩阵
│   └── 海外保险数字化平台_保险公司管理与渠道管理_需求文档 V1.0.0.md
│
├── technical-solution/            # 📑 技术方案文档
│   ├── 技术实现方案_V2.0.md       # 融合版架构设计
│   └── 数据库设计方案_V2.0.md     # PostgreSQL 15 + Drizzle ORM
│
├── 版本迭代/                       # 🔄 版本变更记录
├── 产品测试/                       # ✅ 测试报告与用例
└── [其他业务文档]                 # 实施部署、项目概述等
```

## 🚀 快速导航

### 💻 开发代码目录

```bash
cd OverInsurData\insurance-platform
pnpm install        # 安装依赖
pnpm dev:carrier    # 启动开发服务器（http://localhost:3001）
```

### 📖 查看文档

- **技术方案**: `technical-solution/技术实现方案_V2.0.md`
- **数据库设计**: `technical-solution/数据库设计方案_V2.0.md`
- **需求文档**: `product-requirements/产品功能清单_V1.0.0.md`
- **UI 原型**: `product-solution/UI-V1.0/src/views/`（已迁移到 code 目录）

## 📊 当前状态

### ✅ 已完成（Phase 0-P0 Sprint）

- Monorepo 脚手架搭建
- 国际化框架集成（英文/中文）
- Layout 组件库（Sidebar + TopBar）
- Dashboard KPI Cards

### ⏳ 计划中（Phase 1）

- Insurer List CRUD 页面
- NestJS 模块化单体后端
- PostgreSQL 15 数据库设计落地

## 🛠️ 技术栈概览

| 类别 | 技术选型 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 后端 | NestJS (模块化单体起步) |
| 数据库 | PostgreSQL 15 + Drizzle ORM |
| 认证 | JWT (双模式：集成/独立) |
| 国际化 | react-i18next (en-US / zh-CN) |

## 👥 相关团队

- **产品经理**: 维护 `product-requirements/` 和 `product-solution/`
- **开发工程师**: 在 `insurance-platform/` 开发代码
- **技术架构**: 负责 `technical-solution/` 和技术评审
