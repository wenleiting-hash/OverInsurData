---
name: ddl-gen
description: Generates Flyway DDL migration scripts and data dictionary seeds for the Overseas Insurance Digital Platform per the technical solution V1.0.0 (MySQL 8.0, 9 business databases, strict naming conventions). Use when the user asks to generate 建表语句, DDL, 数据库脚本, Flyway migration, 数据字典初始化, or designs tables for entities like insurance_carrier, channel_org, product_rate_plan. Outputs SQL files only; never executes database commands.
---

# DDL Gen（数据库脚本生成）

依据 `技术方案/技术方案_海外保险数字化平台_V1.0.0.md` 第四章规范生成 Flyway DDL 脚本。**本 skill 只产出 SQL 文件，绝不执行任何数据库命令。**

## ⛔ 安全红线（最高优先级）

1. **禁止执行**任何数据库操作（包括 `mysql`、`flyway migrate`、`prisma db push`、docker 数据库操作等）
2. 若用户要求执行，必须先说明具体命令与影响范围，**获得明确同意**，并确认已备份后才能执行
3. 输出文件统一保存到 `数据库脚本/` 目录（不存在则创建），交付后提示用户人工审核

## 库与表归属

| 库 | 归属实体 |
|---|---|
| db_master_data | insurance_carrier、insurance_product、carrier_partnership、product_rate_plan、数据字典 |
| db_cooperation | 合作协议、结算参数、对接人、续评记录 |
| db_onboarding | 入驻申请、阶段记录、OFAC 筛查、资质文件 |
| db_compliance | Appointment、培训认证、出单拦截日志、豁免记录 |
| db_commission | 佣金方案、计算批次、佣金明细、结算单、追回记录（明细表按月分区） |
| db_performance | KPI 模板、考核周期、得分记录、申诉 |
| db_training | 课程、考试、认证记录 |
| db_auth | 用户、角色、权限、登录日志、审计（审计日志落 ES，此处仅存账号类） |
| db_notification | 模板、消息记录、渠道偏好 |

## 命名规范（必须遵守）

- 库名：`db_{domain}`；表名/字段名：`snake_case`，表名单数（`insurance_carrier` 而非 carriers）
- 主键：`id BIGINT AUTO_INCREMENT`（分库分表场景预留雪花 ID）
- 审计四字段必备：`created_by`、`created_at`、`updated_by`、`updated_at`
- 软删除：`is_deleted TINYINT(1) NOT NULL DEFAULT 0`
- 金额：`DECIMAL(14,2)`；比例/费率：`DECIMAL(6,4)`；禁止 FLOAT
- 状态：`VARCHAR(32)` 存英文常量（如 `'ACTIVE'`、`'SUSPENDED'`），不存数字编码
- 日期时间：`DATETIME` 存 UTC，展示层转美国各时区
- 索引命名：`idx_{表}_{字段}`、唯一索引 `uk_{表}_{字段}`、外键逻辑关联不建物理外键
- 每表、每字段必须有 `COMMENT`（中文业务含义）

## Flyway 脚本规范

```
文件名：V{版本}__{描述}.sql          例：V1.0.1__create_insurance_carrier.sql
顺序：V1.0.x 基础表 → V1.1.x 业务表 → 数据字典用 R__seed_xxx.sql（可重复）
每个脚本头部注释：
-- 数据库：db_master_data
-- 功能点：产品功能清单 § 1.1 保险公司主数据管理
-- 作者/日期：{自动填写}
```
- 一个脚本对应一个聚合（主表 + 关联表），跨库的表拆分到各自脚本
- 脚本必须幂等思路书写：`CREATE TABLE IF NOT EXISTS`，索引先判存在再建（或依赖 Flyway 版本机制不做重复执行）
- 禁止在脚本中包含 `DROP`/`TRUNCATE`/`DELETE FROM` 无 where 语句；变更表结构用 `ALTER` 新脚本递增版本

## 生成流程（检查清单）

```
- [ ] 1. 明确实体来源（需求文档数据模型章节 / 功能清单字段 / 用户指定）
- [ ] 2. 确定归属库与表名
- [ ] 3. 梳理字段（含审计四字段 + is_deleted + COMMENT）
- [ ] 4. 设计索引（高频查询字段：状态、外键ID、业务编号、日期）
- [ ] 5. 生成 Flyway DDL 文件到 数据库脚本/{库名}/
- [ ] 6. 生成对应数据字典种子脚本（如有枚举字段）
- [ ] 7. 输出字段与需求字段映射表
```

## 建表模板

```sql
-- 数据库：db_master_data
-- 功能点：产品功能清单 § 1.1 保险公司主数据管理

CREATE TABLE IF NOT EXISTS insurance_carrier (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '主键',
    carrier_code    VARCHAR(32)     NOT NULL COMMENT '保险公司编码（唯一）',
    carrier_name    VARCHAR(200)    NOT NULL COMMENT '保险公司名称',
    naic_code       VARCHAR(10)     DEFAULT NULL COMMENT 'NAIC编码',
    carrier_type    VARCHAR(32)     NOT NULL COMMENT '类型：ADMITTED/NON_ADMITTED',
    status          VARCHAR(32)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE/INACTIVE/SUSPENDED',
    credit_rating   VARCHAR(16)     DEFAULT NULL COMMENT '信用评级（AM Best等）',
    license_states  VARCHAR(500)    DEFAULT NULL COMMENT '持牌州列表（逗号分隔州代码）',
    created_by      BIGINT          NOT NULL COMMENT '创建人ID',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间(UTC)',
    updated_by      BIGINT          DEFAULT NULL COMMENT '更新人ID',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间(UTC)',
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除：0否 1是',
    PRIMARY KEY (id),
    UNIQUE KEY uk_carrier_code (carrier_code, is_deleted),
    KEY idx_carrier_status (status),
    KEY idx_carrier_naic (naic_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保险公司主数据表';
```

## 特殊设计规则（来自技术方案）

| 场景 | 规则 |
|---|---|
| 层级树（渠道组织） | 邻接表 + `path` 字段（如 `/org1/org5/org9/`），深度限制 5 级；`level` 字段冗余存储 |
| 佣金明细表 | 按 `settle_month` 做 `PARTITION BY RANGE` 月分区，保留 36 个月分区 |
| 佣金快照 | 计算时冻结层级/授权快照，快照表独立存储，计算结果关联快照版本 |
| 审计日志 | **不落 MySQL**，生成说明中注明写入 Elasticsearch（`audit.events`） |
| 规则权重评分 | 佣金规则表含 `weight_score` 冗余字段（保险公司100/产品50/州30/业务线20/缴费10/档位5），匹配时排序用 |
| 多版本方案 | 佣金方案表含 `version`、`effective_from`、`effective_to`，历史版本只读 |
| 大文本/JSON | 配置类用 `JSON` 类型（MySQL 8.0），超长说明用 `TEXT` |

## 数据字典种子脚本模板

```sql
-- R__seed_dict_commission_status.sql
INSERT INTO sys_dict (dict_type, dict_code, dict_name_en, dict_name_zh, sort_order)
VALUES
    ('commission_status', 'PENDING_CALC', 'Pending Calculation', '待计算', 1),
    ('commission_status', 'CALCULATING', 'Calculating', '计算中', 2),
    ('commission_status', 'CALCULATED', 'Calculated', '已计算', 3),
    ('commission_status', 'SETTLED', 'Settled', '已结算', 4)
ON DUPLICATE KEY UPDATE dict_name_en = VALUES(dict_name_en), dict_name_zh = VALUES(dict_name_zh);
```
字典编码命名：`{业务域}_{语义}`，值用英文大写常量，中英双语名称齐全。

## 交付物

1. `数据库脚本/{库名}/V*__*.sql` 脚本文件
2. 字段 ↔ 需求字段映射表（证明覆盖度）
3. 提示语：**"脚本已生成，请人工审核后再执行；如需我执行，请明确同意并确认备份"**
