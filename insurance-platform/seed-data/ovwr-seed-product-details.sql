-- =====================================================
-- 产品详情子表种子数据（承接原前端 mock productDetails.ts 的 p1001 模板）
-- 为库中每个未删除产品挂载一整套：费率方案/可售州(50)/核保规则/培训材料/业绩(6月)
-- 幂等：全部 ON CONFLICT DO NOTHING，可重复执行
-- 说明：channel_count、业绩时序无真实业务源，此处为演示数据，后续接入真实系统替换
-- =====================================================

-- 1) 费率方案（Standard / Enhanced / Archived 三档，rating_factors 双语嵌套）
INSERT INTO product_rate_plan
  (rate_plan_id, product_id, name, tier, base_rate, min_premium, max_premium,
   effective_date, expiry_date, status, rating_factors, filing_status, sort_order)
SELECT p.product_id || '_' || t.rid, p.product_id, t.name, t.tier, t.base_rate, t.min_premium, t.max_premium,
       t.eff, t.exp, t.status, t.rf::jsonb, t.filing, t.so
FROM insurance_product p
CROSS JOIN (VALUES
  ('rp1', 'Standard Auto', 'Standard', 1240, 480, 4200, DATE '2026-01-01', DATE '2026-12-31', 'active',
   '[{"factor":"drivingRecord","description":"过去 3 年无事故折扣","descriptionEn":"Claim-free discount for the past 3 years","weight":0.25},{"factor":"vehicleType","description":"基于车辆安全等级","descriptionEn":"Based on vehicle safety rating","weight":0.20},{"factor":"drivingExperience","description":"< 3年附加 30%","descriptionEn":"+30% loading for under 3 years","weight":0.15},{"factor":"creditScore","description":"Credit-based insurance score","descriptionEn":"Credit-based insurance score","weight":0.20},{"factor":"territory","description":"城市/郊区/农村区分","descriptionEn":"Urban / suburban / rural tiering","weight":0.20}]',
   'approved', 1),
  ('rp2', 'Enhanced Auto', 'Enhanced', 1680, 720, 6500, DATE '2026-01-01', DATE '2026-12-31', 'active',
   '[{"factor":"drivingRecord","description":"过去 5 年全记录分析","descriptionEn":"Full 5-year record analysis","weight":0.30},{"factor":"vehicleType","description":"MSRP + 安全等级加权","descriptionEn":"MSRP weighted with safety rating","weight":0.20},{"factor":"drivingExperience","description":"分级附加系数","descriptionEn":"Tiered loading factors","weight":0.15},{"factor":"creditScore","description":"Tier 1–6 分级","descriptionEn":"Tier 1–6 banding","weight":0.20},{"factor":"usage","description":"通勤/商用/偶尔","descriptionEn":"Commuting / business / pleasure","weight":0.15}]',
   'approved', 2),
  ('rp3', 'Q4 2025 Archived', 'Standard', 1190, 460, 4000, DATE '2025-10-01', DATE '2025-12-31', 'expired',
   '[]', 'approved', 3)
) AS t(rid, name, tier, base_rate, min_premium, max_premium, eff, exp, status, rf, filing, so)
WHERE p.deleted = FALSE
ON CONFLICT (rate_plan_id) DO NOTHING;

-- 2) 可售州明细（全部 50 州；CA/NV/AZ=active，OR=pending，其余 not-available）
INSERT INTO product_state
  (product_id, state_code, state_name, enabled, status, effective_date, filing_number, channel_count)
SELECT p.product_id, s.code, s.name,
       s.code IN ('CA','NV','AZ'),
       CASE WHEN s.code IN ('CA','NV','AZ') THEN 'active' WHEN s.code = 'OR' THEN 'pending' ELSE 'not-available' END,
       CASE WHEN s.code IN ('CA','NV','AZ') THEN DATE '2020-01-01' ELSE NULL END,
       CASE WHEN s.code IN ('CA','NV','AZ') THEN 'FL-' || s.code || '-' || UPPER(p.product_id) || '-2020' ELSE NULL END,
       CASE WHEN s.code IN ('CA','NV','AZ') THEN 3 + (ascii(s.code) * 7 + ascii(substr(s.code, 2, 1)) * 3) % 20 ELSE 0 END
FROM insurance_product p
CROSS JOIN (VALUES
  ('AL','Alabama'),('AK','Alaska'),('AZ','Arizona'),('AR','Arkansas'),('CA','California'),
  ('CO','Colorado'),('CT','Connecticut'),('DE','Delaware'),('FL','Florida'),('GA','Georgia'),
  ('HI','Hawaii'),('ID','Idaho'),('IL','Illinois'),('IN','Indiana'),('IA','Iowa'),
  ('KS','Kansas'),('KY','Kentucky'),('LA','Louisiana'),('ME','Maine'),('MD','Maryland'),
  ('MA','Massachusetts'),('MI','Michigan'),('MN','Minnesota'),('MS','Mississippi'),('MO','Missouri'),
  ('MT','Montana'),('NE','Nebraska'),('NV','Nevada'),('NH','New Hampshire'),('NJ','New Jersey'),
  ('NM','New Mexico'),('NY','New York'),('NC','North Carolina'),('ND','North Dakota'),('OH','Ohio'),
  ('OK','Oklahoma'),('OR','Oregon'),('PA','Pennsylvania'),('RI','Rhode Island'),('SC','South Carolina'),
  ('SD','South Dakota'),('TN','Tennessee'),('TX','Texas'),('UT','Utah'),('VT','Vermont'),
  ('VA','Virginia'),('WA','Washington'),('WV','West Virginia'),('WI','Wisconsin'),('WY','Wyoming')
) AS s(code, name)
WHERE p.deleted = FALSE
ON CONFLICT (product_id, state_code) DO NOTHING;

-- 3) 核保规则（6 条，双语，按 priority 排序）
INSERT INTO product_underwriting_rule
  (rule_id, product_id, name, name_en, category, priority, "condition", condition_en,
   condition_detail, condition_detail_en, action, action_value, action_value_en,
   status, last_modified, modified_by)
SELECT p.product_id || '_' || t.rid, p.product_id, t.name, t.name_en, t.category, t.priority, t.cond, t.cond_en,
       t.cond_detail, t.cond_detail_en, t.action, t.action_value, t.action_value_en,
       t.status, t.last_modified, t.modified_by
FROM insurance_product p
CROSS JOIN (VALUES
  ('ur1','无驾照申请人拒保','Decline Unlicensed Applicants','eligibility',1,
   '申请人.驾照状态 = 无效 OR 吊销','applicant.licenseStatus = invalid OR revoked',
   '驾照状态检查：无有效驾照、已吊销、已暂停','License status check: no valid license, revoked, or suspended',
   'decline','自动拒保','Automatic decline','active',DATE '2026-06-15','System Auto'),
  ('ur2','DUI 记录附加保费','DUI Record Surcharge','rating',2,
   '驾驶记录.DUI次数 >= 1 AND 发生时间 <= 5年','drivingRecord.duiCount >= 1 AND occurrence within 5 years',
   '过去 5 年内有 DUI 记录，按次数阶梯附加','DUI on record within the past 5 years; surcharge scales by count',
   'surcharge','1次 +35%，2次 +80%，3次+ 拒保','1st: +35%, 2nd: +80%, 3+: decline','active',DATE '2026-01-10','Zhang Wei'),
  ('ur3','高价值车辆核保转介','High-Value Vehicle Referral','referral',3,
   'vehicle.MSRP > $150,000','vehicle.MSRP > $150,000',
   '车辆市场价值超过 15 万美元需人工核保审核','Vehicles with a market value above $150,000 require manual underwriting review',
   'refer','转高净值承保团队','Refer to High-Net-Worth underwriting team','active',DATE '2025-11-20','Wang Fang'),
  ('ur4','优良驾驶记录折扣','Good Driver Discount','rating',4,
   '驾驶记录.事故次数 = 0 AND 驾龄 >= 5年','drivingRecord.accidentCount = 0 AND drivingExperience >= 5 years',
   '连续 5 年无事故且驾龄超 5 年','Five consecutive claim-free years with more than 5 years of driving experience',
   'discount','-10%','-10%','active',DATE '2025-09-01','System Auto'),
  ('ur5','商业用途车辆排除','Commercial Use Exclusion','exclusion',5,
   'vehicle.use = 商业运营 OR 网约车','vehicle.use = commercial OR rideshare',
   '用于运营出租/网约车业务的车辆不在本产品承保范围','Vehicles used for livery or rideshare business are outside the scope of this product',
   'decline','建议转商业险产品','Recommend a commercial auto product','active',DATE '2025-07-01','Chen Hao'),
  ('ur6','新驾照低信用评分观察','New Driver / Low Credit Score Review','referral',6,
   '驾龄 < 2年 AND credit_score < 580','drivingExperience < 2 years AND credit_score < 580',
   '新手驾驶员且信用分低于 580 需人工审核','Newly licensed drivers with a credit score below 580 require manual review',
   'refer','转标准核保团队，附加 15-25%','Refer to standard underwriting team; apply 15–25% surcharge','testing',DATE '2026-08-01','Liu Yang')
) AS t(rid, name, name_en, category, priority, cond, cond_en, cond_detail, cond_detail_en,
       action, action_value, action_value_en, status, last_modified, modified_by)
WHERE p.deleted = FALSE
ON CONFLICT (rule_id) DO NOTHING;

-- 4) 培训材料（6 份，双语标题 + 文件元数据 + required_for）
INSERT INTO product_training_material
  (material_id, product_id, title, title_en, type, file_name, file_size,
   upload_date, uploaded_by, version, downloads, required_for, expiry_date, sort_order)
SELECT p.product_id || '_' || t.rid, p.product_id, t.title, t.title_en, t.type, t.file_name, t.file_size,
       t.upload_date, t.uploaded_by, t.version, t.downloads, t.required_for::jsonb, t.expiry_date, t.so
FROM insurance_product p
CROSS JOIN (VALUES
  ('tm1','Travelers Auto 产品指南 2026','Travelers Auto Product Guide 2026','product-guide',
   'TRV-AUTO-ProductGuide-2026.pdf','4.2 MB',DATE '2026-01-15','Wang Fang','v3.2',284,
   '["Independent Agency","Broker"]',DATE '2026-12-31',1),
  ('tm2','费率手册 Q3 2026','Rate Manual Q3 2026','rate-manual',
   'TRV-AUTO-RateManual-Q3-2026.xlsx','1.8 MB',DATE '2026-07-01','Zhang Wei','v2026.3',156,
   '["Independent Agency","Broker","MGA"]',DATE '2026-09-30',2),
  ('tm3','核保规则手册 v4.1','Underwriting Rules Manual v4.1','underwriting-guide',
   'TRV-AUTO-UW-Guide-v4.1.pdf','6.1 MB',DATE '2026-03-20','Chen Hao','v4.1',201,
   '["Independent Agency","Broker","MGA","Wholesale Broker"]',NULL,3),
  ('tm4','加州监管合规要求 2026','California Regulatory Compliance Requirements 2026','compliance',
   'CA-Compliance-AutoIns-2026.pdf','2.3 MB',DATE '2026-02-01','Liu Yang','v2026.1',89,
   '["Independent Agency","Broker"]',DATE '2026-12-31',4),
  ('tm5','渠道培训课件 — 产品销售技巧','Channel Training Deck — Product Sales Skills','training-deck',
   'TRV-AUTO-SalesTraining-2026.pptx','18.4 MB',DATE '2026-04-10','Wang Fang','v2.0',312,
   '["Independent Agency","Broker"]',NULL,5),
  ('tm6','常见问题解答 FAQ v2.3','Frequently Asked Questions v2.3','faq',
   'TRV-AUTO-FAQ-v2.3.pdf','0.9 MB',DATE '2026-06-01','System','v2.3',445,
   '[]',NULL,6)
) AS t(rid, title, title_en, type, file_name, file_size, upload_date, uploaded_by, version,
       downloads, required_for, expiry_date, so)
WHERE p.deleted = FALSE
ON CONFLICT (material_id) DO NOTHING;

-- 5) 业绩表现（6 个月时序，period_order 升序，末位 Aug 为最新月）
INSERT INTO product_performance
  (product_id, month, premium, new_biz, renewal, policies, loss_ratio, claims_count, period_order)
SELECT p.product_id, t.month, t.premium, t.new_biz, t.renewal, t.policies, t.loss_ratio, t.claims_count, t.po
FROM insurance_product p
CROSS JOIN (VALUES
  ('Mar ''26', 24.8, 3.2, 21.6, 1420, 0.608, 184, 1),
  ('Apr ''26', 25.6, 3.5, 22.1, 1480, 0.615, 191, 2),
  ('May ''26', 26.4, 3.8, 22.6, 1520, 0.601, 178, 3),
  ('Jun ''26', 27.2, 4.1, 23.1, 1590, 0.618, 204, 4),
  ('Jul ''26', 27.8, 4.3, 23.5, 1620, 0.609, 196, 5),
  ('Aug ''26', 28.5, 4.6, 23.9, 1680, 0.612, 201, 6)
) AS t(month, premium, new_biz, renewal, policies, loss_ratio, claims_count, po)
WHERE p.deleted = FALSE
ON CONFLICT (product_id, month) DO NOTHING;
