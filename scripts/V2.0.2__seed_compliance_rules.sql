-- ============================================================================
-- V2.0.2 — 合规规则种子数据 (~10 条默认规则)
-- ============================================================================

INSERT INTO compliance_rule (rule_id, rule_name, rule_name_en, category, condition_expr, condition_expr_en, action, priority, enabled, triggered_count) VALUES
('cr1', 'Appointment 有效性校验',   'Appointment Validity Check',    'appointment', '渠道在目标州无有效 Appointment',       'Channel has no valid appointment in the target state',        'block',          10, TRUE, 0),
('cr2', 'Appointment 过期校验',     'Appointment Expiry Check',      'appointment', 'Appointment 已过期超过 30 天',         'Appointment expired more than 30 days ago',                  'block',          15, TRUE, 0),
('cr3', '牌照有效性校验',           'License Validity Check',        'license',     '渠道牌照状态非 active',               'Channel license status is not active',                        'block',          10, TRUE, 0),
('cr4', '牌照到期预警',             'License Expiry Warning',        'license',     '牌照将在 90 天内到期',                 'License will expire within 90 days',                          'warn',           30, TRUE, 0),
('cr5', 'OFAC 强制筛查',            'OFAC Mandatory Screening',      'ofac',        '所有新渠道/新客户必须通过 OFAC 筛查',  'All new channels/customers must pass OFAC screening',         'block',          5,  TRUE, 0),
('cr6', 'OFAC 高分匹配审核',        'OFAC High-Score Match Review',  'ofac',        'OFAC 匹配分数 ≥ 80 需人工审核',       'OFAC match score ≥ 80 requires manual review',                'require-review', 8,  TRUE, 0),
('cr7', '暂停渠道交易拦截',         'Suspended Channel Block',       'channel',     '渠道状态为 suspended/terminated',      'Channel status is suspended or terminated',                    'block',          10, TRUE, 0),
('cr8', '州授权范围校验',           'State Authorization Check',     'product',     '业务线不在州授权范围内',               'Line of business not authorized in the state',                'warn',           20, TRUE, 0),
('cr9', '超额佣金预警',             'Excess Commission Alert',       'product',     '佣金率超过协议费率 2%',               'Commission rate exceeds agreed rate by more than 2%',         'warn',           25, TRUE, 0),
('cr10','新产品合规审核',           'New Product Compliance Review', 'product',     '新产品上线前需合规审核',               'New products require compliance review before launch',        'require-review', 15, TRUE, 0);
