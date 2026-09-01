---
kind: external_dependency
name: OFAC 制裁名单筛查（合规前置拦截）
slug: ofac-sanctions-screening
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### OFAC（Office of Foreign Assets Control）制裁名单
- 角色：美国财政部海外资产控制办公室发布的受制裁实体/个人名单，平台在渠道入驻和代理人新增时进行自动筛查，防止与受制裁主体合作。
- 集成点：`渠道入驻与准入` 流程中的自动筛查环节；`Appointment与合规管理` 中的「OFAC制裁筛查」功能，支持单条/批量/手动筛查。
- 稳定用法：对申请主体的名称等关键字段与 OFAC 名单比对，命中则拒绝入驻或暂停合作；疑似命中需人工复核；名单需定期更新。
- 约束：命中即阻断是合规红线，不可绕过；误报需保留复核记录与审计轨迹。
- 注意：具体名单数据来源（直接对接 OFAC 或通过第三方合规服务商）及匹配算法需按合规要求实现。