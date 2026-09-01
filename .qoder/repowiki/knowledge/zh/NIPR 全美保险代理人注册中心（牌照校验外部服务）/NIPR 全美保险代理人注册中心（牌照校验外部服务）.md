---
kind: external_dependency
name: NIPR 全美保险代理人注册中心（牌照校验外部服务）
slug: nipr
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### NIPR（National Insurance Producer Registry）
- 角色：美国保险代理人牌照信息查询的外部权威数据源，平台通过其 API 实时校验代理人的 NPN 号、持牌状态、持牌州及业务线。
- 集成点：`Appointment与合规管理` 模块的「NIPR牌照校验」功能，支持单条/批量/定时自动校验；`渠道入驻与准入` 流程中作为前置校验环节。
- 稳定用法：以 NPN 为键调用 NIPR 查询接口，返回结果用于标记异常（过期/吊销/暂停）并触发通知；系统需维护校验历史与手动刷新能力。
- 约束：依赖 NIPR 服务的可用性与响应时效；批量校验与定时任务需考虑限流与重试策略。
- 注意：具体 API 端点、鉴权方式与字段定义需对照 NIPR 官方文档确认。