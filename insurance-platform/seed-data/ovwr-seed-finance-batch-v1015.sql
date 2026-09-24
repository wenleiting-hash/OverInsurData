-- ============================================================================
-- V1.0.15 (2026-09-16) — Phase D 财务批次 / 佣金率 / 合作域 真实种子数据（O7）
--
-- 前置：已执行
--   ovwr-migration-commission-rate-v1014.sql
--   ovwr-migration-finance-batch-v1015.sql
--   ovwr-migration-coop-v1015.sql
--   ovwr-seed-insurer-product-cooperation.sql（保司/产品/合作/合同基线）
--
-- 数据口径（全部金额可手工核算）：
--   保司佣金 = premium × 保司账单费率；我方期望佣金 = premium × 四级回退后费率；
--   diff_amount = 保司佣金 - 我方期望佣金；行级差异 reconciliation_diff.line_id 关联。
--
-- 覆盖场景：
--   佣金率      c1001 四档回退全覆盖（product_state/product_all/lob_state/lob_all），
--               CA 汽车/房屋费率 v1 失效 + v2 生效（版本对比可演示）；c1002 产品档
--   待对账批次  bill15trv01（TRV 2026-09，4 入账/1 重复/1 失败）
--               bill15chb01（CHB 2026-09，2 入账/1 重复/1 失败）
--   对账中批次  bill15trv03（TRV 2026-06，2 open + 1 suspended + 3 resolved；
--               因仍有 open/suspended，封帐必须被 409 拒绝——O2）
--   已封帐批次  bill15trv02（TRV 2026-07，差异全部 resolved，completed 锁定）
--   续约登记    rn15reg001（coop001 已登记续约至 2028-01-14，O6 直接登记留痕）
--   产品关联    coop001↔p1001/p1005/p1010、coop002↔p1002/p1006；
--               p1001 被渠道 c1 授权占用（取消关联触发 409 占用清单）
--
-- 幂等：所有行使用固定 ID，先 DELETE 再 INSERT；续约日期更新带原日期条件。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) 清理固定 ID（按外键/引用顺序）
-- ----------------------------------------------------------------------------
DELETE FROM reconciliation_diff
 WHERE diff_id IN ('df15b03','df15c02','df15c04','df15c07','df15c08','df15c09','df15c10');
DELETE FROM commission_bill_line
 WHERE line_id IN
   ('bl15a01','bl15a02','bl15a03','bl15a04','bl15a05','bl15a06',
    'bl15b01','bl15b02','bl15b03',
    'bl15c01','bl15c02','bl15c03','bl15c04','bl15c05',
    'bl15c06','bl15c07','bl15c08','bl15c09','bl15c10',
    'bl15d01','bl15d02','bl15d03','bl15d04');
DELETE FROM commission_bill
 WHERE bill_id IN ('bill15trv01','bill15trv02','bill15trv03','bill15chb01');
DELETE FROM cooperation_product
 WHERE link_id IN ('cpl15p1001','cpl15p1005','cpl15p1010','cpl15p1002','cpl15p1006');
DELETE FROM channel_product_authorization WHERE auth_id = 'cpa15001';
DELETE FROM carrier_renewal_task       WHERE renewal_id = 'rn15reg001';
DELETE FROM carrier_commission_rate
 WHERE rate_id IN
   ('rate15trv01','rate15trv02','rate15trv03','rate15trv04',
    'rate15trv05','rate15trv06','rate15trv07','rate15trv08','rate15trv09',
    'rate15chb01','rate15chb02','rate15chb03');

-- ----------------------------------------------------------------------------
-- 1) 佣金率（一行一州单值，NULL 州=全域；O5）
-- ----------------------------------------------------------------------------
INSERT INTO carrier_commission_rate
  (rate_id, carrier_id, dimension, line_of_business, product_id, state,
   rate, effective_from, effective_to, status, version, created_by, remark,
   deleted, created_at, updated_at)
VALUES
  -- c1001 Travelers：p1001 加州汽车责任险，CA 州费率有 v1/v2 两个版本
  ('rate15trv01','c1001','product',NULL,'p1001','CA',
   0.1450, DATE '2024-01-15', DATE '2025-12-31','expired',1,'admin',
   '2024-2025 contractual rate (CA auto liability), superseded by the 2026 version', FALSE, NOW(), NOW()),
  ('rate15trv02','c1001','product',NULL,'p1001','CA',
   0.1500, DATE '2026-01-01', NULL,'active',2,'ops_li',
   '2026 annual adjustment: CA auto liability 14.50% -> 15.00%', FALSE, NOW(), NOW()),
  ('rate15trv03','c1001','product',NULL,'p1001','NV',
   0.1400, DATE '2024-01-15', NULL,'active',1,'admin',
   'NV auto liability contractual rate', FALSE, NOW(), NOW()),
  ('rate15trv04','c1001','product',NULL,'p1001','AZ',
   0.1350, DATE '2024-01-15', NULL,'active',1,'admin',
   'AZ auto liability contractual rate', FALSE, NOW(), NOW()),
  -- c1001：HOME 险种级，CA 州档 v1/v2 + 全域档（非 CA/NV 州回退）
  ('rate15trv05','c1001','lob','HOME',NULL,'CA',
   0.1200, DATE '2024-02-01', DATE '2025-12-31','expired',1,'admin',
   '2024-2025 CA homeowners rate, superseded by the 2026 version', FALSE, NOW(), NOW()),
  ('rate15trv06','c1001','lob','HOME',NULL,'CA',
   0.1250, DATE '2026-01-01', NULL,'active',2,'ops_li',
   '2026 annual adjustment: CA homeowners 12.00% -> 12.50%', FALSE, NOW(), NOW()),
  ('rate15trv07','c1001','lob','HOME',NULL,NULL,
   0.1150, DATE '2024-02-01', NULL,'active',1,'admin',
   'Homeowners global fallback tier (applies when no product/state tier matches)', FALSE, NOW(), NOW()),
  ('rate15trv08','c1001','lob','AUTO',NULL,NULL,
   0.1300, DATE '2024-01-15', NULL,'active',1,'admin',
   'Auto global fallback tier (applies to states not covered by product tiers)', FALSE, NOW(), NOW()),
  -- c1001：p1010 重疾健康险，产品全域档（product_all）
  ('rate15trv09','c1001','product',NULL,'p1010',NULL,
   0.1800, DATE '2024-07-01', NULL,'active',1,'admin',
   'MA critical care health insurance global contractual rate', FALSE, NOW(), NOW()),
  -- c1002 Chubb：p1002 NY 州档；p1006 公寓险全域档 v1/v2
  ('rate15chb01','c1002','product',NULL,'p1002','NY',
   0.1600, DATE '2024-03-01', NULL,'active',1,'admin',
   'NY comprehensive auto contractual rate', FALSE, NOW(), NOW()),
  ('rate15chb02','c1002','product',NULL,'p1006',NULL,
   0.1300, DATE '2026-01-01', NULL,'active',2,'ops_li',
   'NY condo insurance 2026 rate 12.50% -> 13.00%', FALSE, NOW(), NOW()),
  ('rate15chb03','c1002','product',NULL,'p1006',NULL,
   0.1250, DATE '2024-04-15', DATE '2025-12-31','expired',1,'admin',
   'NY condo insurance 2024-2025 rate, no longer in effect', FALSE, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 1.5) 映射模板（批次 FK 引用，幂等）
-- ----------------------------------------------------------------------------
INSERT INTO bill_field_mapping_template
  (template_id, insurer_id, category, template_name, file_format, sheet_name, header_row, mapping_json, enabled, deleted, created_at, updated_at)
VALUES
  ('tpl15trv01','c1001','commission','Travelers Commission Statement Template','xlsx','Sheet1',1,
   '{"policy_number":"A","insured_name":"B","channel_name":"C","state":"D","line_of_business":"E","effective_date":"F","premium":"G","commission_rate":"H","commission_amount":"I","npn":"J","product_code":"K"}'::jsonb,
   TRUE,FALSE,NOW(),NOW()),
  ('tpl15chb01','c1002','commission','Chubb Commission Statement Template','csv',NULL,1,
   '{"policy_number":"A","insured_name":"B","channel_name":"C","state":"D","line_of_business":"E","effective_date":"F","premium":"G","commission_rate":"H","commission_amount":"I","npn":"J","product_code":"K"}'::jsonb,
   TRUE,FALSE,NOW(),NOW())
ON CONFLICT (template_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) 佣金账单批次（固定批次号；O1：一批=一保司+一账单月份）
-- ----------------------------------------------------------------------------
INSERT INTO commission_bill
  (bill_id, batch_no, file_name, insurer_id, insurer_name, insurer_short,
   period, period_month, import_date, imported_by, file_size, file_format,
   status, import_status, recon_status,
   total_policies, total_premium, total_commission,
   parsed_policies, matched_policies, exception_count,
   reconciled_amount, difference_amount,
   success_count, failed_count, duplicate_count,
   locked_by, locked_at, completed_at,
   category, source_stored_name, mapping_template_id, import_stats,
   created_at, updated_at)
VALUES
  -- 待对账：TRV 2026-09，4 入账 / 1 批内重复 / 1 解析失败
  ('bill15trv01','IMP-20260915-001','travelers-2026-09-commission.xlsx',
   'c1001','Travelers Insurance Company','TRV',
   '2026-09','2026-09', TIMESTAMPTZ '2026-09-15 09:32:00+00','finance_wang','9.2 KB','xlsx',
   'uploaded','imported','pending',
   4, 39500.00, 5830.00, 6, 0, 0, 0, 0,
   4, 1, 1,
   NULL, NULL, NULL,
   'commission','travelers-2026-09-commission.xlsx','tpl15trv01',
   '{"total":6,"imported":4,"duplicate":1,"failed":1}'::jsonb,
   TIMESTAMPTZ '2026-09-15 09:32:00+00', TIMESTAMPTZ '2026-09-15 09:32:00+00'),
  -- 已封帐：TRV 2026-07，唯一差异已 resolved（rate_corrected）
  ('bill15trv02','IMP-20260715-002','travelers-2026-07-commission.xlsx',
   'c1001','Travelers Insurance Company','TRV',
   '2026-07','2026-07', TIMESTAMPTZ '2026-07-15 10:05:00+00','finance_wang','7.8 KB','xlsx',
   'reconciled','imported','completed',
   3, 27500.00, 3787.50, 3, 2, 1, 3825.00, -37.50,
   3, 0, 0,
   'ops_li', TIMESTAMPTZ '2026-07-18 16:40:00+00', TIMESTAMPTZ '2026-07-18 16:40:00+00',
   'commission','travelers-2026-07-commission.xlsx','tpl15trv01',
   '{"total":3,"imported":3,"duplicate":0,"failed":0}'::jsonb,
   TIMESTAMPTZ '2026-07-15 10:05:00+00', TIMESTAMPTZ '2026-07-18 16:40:00+00'),
  -- 对账中：TRV 2026-06，10 行：4 一致 + 2 open + 1 suspended + 3 resolved（封帐应被拒）
  ('bill15trv03','IMP-20260615-003','travelers-2026-06-commission.xlsx',
   'c1001','Travelers Insurance Company','TRV',
   '2026-06','2026-06', TIMESTAMPTZ '2026-06-15 09:10:00+00','finance_wang','11.6 KB','xlsx',
   'exception','imported','running',
   10, 68200.00, 9292.50, 10, 4, 6, 9510.50, -218.00,
   10, 0, 0,
   NULL, NULL, NULL,
   'commission','travelers-2026-06-commission.xlsx','tpl15trv01',
   '{"total":10,"imported":10,"duplicate":0,"failed":0}'::jsonb,
   TIMESTAMPTZ '2026-06-15 09:10:00+00', TIMESTAMPTZ '2026-06-16 11:20:00+00'),
  -- 待对账：CHB 2026-09，2 入账 / 1 批内重复 / 1 校验失败
  ('bill15chb01','IMP-20260915-004','chubb-2026-09-commission.csv',
   'c1002','Chubb Limited','CHB',
   '2026-09','2026-09', TIMESTAMPTZ '2026-09-15 14:18:00+00','finance_wang','3.1 KB','csv',
   'uploaded','imported','pending',
   2, 15000.00, 2130.00, 4, 0, 0, 0, 0,
   2, 1, 1,
   NULL, NULL, NULL,
   'commission','chubb-2026-09-commission.csv','tpl15chb01',
   '{"total":4,"imported":2,"duplicate":1,"failed":1}'::jsonb,
   TIMESTAMPTZ '2026-09-15 14:18:00+00', TIMESTAMPTZ '2026-09-15 14:18:00+00');

-- ----------------------------------------------------------------------------
-- 3) 账单行
--    待对账批次：仅保司三值，our_* / match_status / trial_level 均为空（试算后才写）
--    对账中/已封帐：三值齐备，trial_level 与四级回退一致
-- ----------------------------------------------------------------------------
INSERT INTO commission_bill_line
  (line_id, bill_id, line_number, policy_number, insured_name, channel_name,
   state, line_of_business, effective_date,
   premium, commission_rate, commission_amount,
   our_policy_number, our_commission_rate, our_commission_amount,
   diff_amount, match_status, npn, product_code, category,
   deleted, created_at, updated_at,
   insurer_id, period_month, line_status, error_reason, skip_reason, trial_level)
VALUES
  -- ── bill15trv01：TRV 2026-09 待对账（4 入账 + 1 重复 + 1 失败）──────────
  ('bl15a01','bill15trv01',1,'P-2026-09001','Acme Manufacturing LLC',
   'Northstar Brokerage','CA','AUTO',DATE '2026-09-01',
   10000.00,0.1500,1500.00,
   NULL,NULL,NULL,NULL,NULL,
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','imported',NULL,NULL,NULL),
  ('bl15a02','bill15trv01',2,'P-2026-09002','Blue Harbor Logistics Inc',
   'Northstar Brokerage','NV','AUTO',DATE '2026-09-01',
   8000.00,0.1400,1120.00,
   NULL,NULL,NULL,NULL,NULL,
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','imported',NULL,NULL,NULL),
  ('bl15a03','bill15trv01',3,'H-2026-09003','Cedar Ridge Homes LLC',
   'Golden Gate Agency','CA','HOME',DATE '2026-09-01',
   12000.00,0.1250,1500.00,
   NULL,NULL,NULL,NULL,NULL,
   '1845620031','CA-HOME-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','imported',NULL,NULL,NULL),
  ('bl15a04','bill15trv01',4,'M-2026-09004','Desert Sage Medical Group',
   'Independent Agents Inc','WA','HEALTH',DATE '2026-09-01',
   9500.00,0.1800,1710.00,
   NULL,NULL,NULL,NULL,NULL,
   '1559830027','MA-HEALTH-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','imported',NULL,NULL,NULL),
  ('bl15a05','bill15trv01',5,'P-2026-09001','Acme Manufacturing LLC',
   'Northstar Brokerage','CA','AUTO',DATE '2026-09-01',
   10000.00,0.1500,1500.00,
   NULL,NULL,NULL,NULL,NULL,
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','duplicate',NULL,
   'duplicate-policy-in-batch: P-2026-09001 already imported as line 1 of this batch',NULL),
  ('bl15a06','bill15trv01',6,'P-2026-09006','Evergreen Logistics Co',
   'Independent Agents Inc','TX','AUTO',DATE '2026-09-01',
   NULL,NULL,NULL,
   NULL,NULL,NULL,NULL,NULL,
   '1559830027','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-09','failed',
   'Line 6 premium is empty and cannot be parsed as a number; import skipped',NULL,NULL),

  -- ── bill15trv02：TRV 2026-07 已封帐（3 入账，1 条费率差已解决）──────────
  ('bl15b01','bill15trv02',1,'P-2026-07001','North Bay Electronics Inc',
   'Northstar Brokerage','CA','AUTO',DATE '2026-07-01',
   11000.00,0.1500,1650.00,
   NULL,0.1500,1650.00,
   0.00,'matched',
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-07','imported',NULL,NULL,'product_state'),
  ('bl15b02','bill15trv02',2,'P-2026-07002','Sierra Vineyards LLC',
   'Golden Gate Agency','CA','HOME',DATE '2026-07-01',
   9000.00,0.1250,1125.00,
   NULL,0.1250,1125.00,
   0.00,'matched',
   '1845620031','CA-HOME-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-07','imported',NULL,NULL,'lob_state'),
  ('bl15b03','bill15trv02',3,'P-2026-07003','Lakeside Dental Group',
   'Northstar Brokerage','NV','AUTO',DATE '2026-07-01',
   7500.00,0.1350,1012.50,
   NULL,0.1400,1050.00,
   -37.50,'rate_diff',
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-07','imported',NULL,NULL,'product_state'),

  -- ── bill15trv03：TRV 2026-06 对账中（10 行，覆盖五档/五类处理结果）──────
  ('bl15c01','bill15trv03',1,'P-2026-06001','Acme West Coast Plant',
   'Northstar Brokerage','CA','AUTO',DATE '2026-06-01',
   9000.00,0.1500,1350.00,
   NULL,0.1500,1350.00,
   0.00,'matched',
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'product_state'),
  ('bl15c02','bill15trv03',2,'P-2026-06002','Reno Logistics Hub',
   'Northstar Brokerage','NV','AUTO',DATE '2026-06-01',
   7000.00,0.1300,910.00,
   NULL,0.1400,980.00,
   -70.00,'rate_diff',
   '1782539942','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'product_state'),
  ('bl15c03','bill15trv03',3,'P-2026-06003','Austin Freight Depot',
   'Lone Star Brokerage','TX','AUTO',DATE '2026-06-01',
   6000.00,0.1300,780.00,
   NULL,0.1300,780.00,
   0.00,'matched',
   '23459012','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'lob_all'),
  ('bl15c04','bill15trv03',4,'P-2026-06004','Seattle Coastal Living LLC',
   'Cascade Independent Agents','WA','HOME',DATE '2026-06-01',
   10000.00,0.1150,1100.00,
   NULL,0.1150,1150.00,
   -50.00,'amount_diff',
   '1923450087','CA-HOME-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'lob_all'),
  ('bl15c05','bill15trv03',5,'P-2026-06005','Sacramento Family Housing',
   'Golden Gate Agency','CA','HOME',DATE '2026-06-01',
   8000.00,0.1250,1000.00,
   NULL,0.1250,1000.00,
   0.00,'matched',
   '1845620031','CA-HOME-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'lob_state'),
  ('bl15c06','bill15trv03',6,'P-2026-06006','Florida Surety Bond Co',
   'Sunshine State Brokers','FL','SURETY',DATE '2026-06-01',
   5000.00,0.2000,1000.00,
   NULL,0.2000,1000.00,
   0.00,'matched',
   '56782345','SURETY-BOND-99','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'bill_original'),
  ('bl15c07','bill15trv03',7,'P-2026-06007','Phoenix Auto Fleet',
   'Southwest Insurance Network','AZ','AUTO',DATE '2026-06-01',
   6500.00,0.1300,845.00,
   NULL,0.1350,877.50,
   -32.50,'rate_diff',
   '90126789','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'product_state'),
  ('bl15c08','bill15trv03',8,'P-2026-06008','Portland Home Rentals LLC',
   'Cascade Independent Agents','OR','HOME',DATE '2026-06-01',
   7200.00,0.1150,800.00,
   NULL,0.1150,828.00,
   -28.00,'amount_diff',
   '1923450087','CA-HOME-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'lob_all'),
  ('bl15c09','bill15trv03',9,'P-2026-06009','Boston Critical Care Group',
   'Empire State Insurance Services','MA','HEALTH',DATE '2026-06-01',
   4000.00,0.1800,710.00,
   NULL,0.1800,720.00,
   -10.00,'amount_diff',
   '45671234','MA-HEALTH-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'product_all'),
  ('bl15c10','bill15trv03',10,'P-2026-06010','Bay Area Ride Services',
   'Pacific Coast Insurance Group','CA','AUTO',DATE '2026-06-01',
   5500.00,0.1450,797.50,
   NULL,0.1500,825.00,
   -27.50,'rate_diff',
   '12348901','CA-LIAB-2026','commission',
   FALSE,NOW(),NOW(),
   'c1001','2026-06','imported',NULL,NULL,'product_state'),

  -- ── bill15chb01：CHB 2026-09 待对账（2 入账 + 1 重复 + 1 失败）──────────
  ('bl15d01','bill15chb01',1,'PP-C-2026-09001','Empire State Garage LLC',
   'Metro Commercial Brokers','NY','AUTO',DATE '2026-09-01',
   6000.00,0.1600,960.00,
   NULL,NULL,NULL,NULL,NULL,
   '1204988335','NY-COMP-2026','commission',
   FALSE,NOW(),NOW(),
   'c1002','2026-09','imported',NULL,NULL,NULL),
  ('bl15d02','bill15chb01',2,'PP-C-2026-09002','Manhattan Condo Trust',
   'Metro Commercial Brokers','NY','HOME',DATE '2026-09-01',
   9000.00,0.1300,1170.00,
   NULL,NULL,NULL,NULL,NULL,
   '1204988335','NY-CONDO-2026','commission',
   FALSE,NOW(),NOW(),
   'c1002','2026-09','imported',NULL,NULL,NULL),
  ('bl15d03','bill15chb01',3,'PP-C-2026-09001','Empire State Garage LLC',
   'Metro Commercial Brokers','NY','AUTO',DATE '2026-09-01',
   6000.00,0.1600,960.00,
   NULL,NULL,NULL,NULL,NULL,
   '1204988335','NY-COMP-2026','commission',
   FALSE,NOW(),NOW(),
   'c1002','2026-09','duplicate',NULL,
   'duplicate-policy-in-batch: PP-C-2026-09001 already imported as line 1 of this batch',NULL),
  ('bl15d04','bill15chb01',4,'PP-C-2026-09004','Jersey City Fleet Inc',
   'Metro Commercial Brokers','NJ','AUTO',DATE '2026-09-01',
   4500.00,NULL,NULL,
   NULL,NULL,NULL,NULL,NULL,
   '1204988335','NY-COMP-2026','commission',
   FALSE,NOW(),NOW(),
   'c1002','2026-09','failed',
   'Line 4 commission rate 16.50% exceeds the contractual cap of 16.00%; suspected carrier entry error, skipped',NULL,NULL);

-- ----------------------------------------------------------------------------
-- 4) 行级差异（bill15trv03 对账中：2 open / 1 suspended / 3 resolved；
--    bill15trv02 已封帐：1 resolved。五类 resolution_result 全覆盖）
-- ----------------------------------------------------------------------------
INSERT INTO reconciliation_diff
  (diff_id, bill_id, line_id, bill_name, insurer_id, insurer_short, policy_number,
   insured_name, diff_type, bill_amount, our_amount, diff_amount,
   status, resolution, resolution_result, note, suspend_reason,
   assigned_to, created_date, resolved_by, resolved_date,
   category, follow_ups, deleted, created_at, updated_at)
VALUES
  -- 已封帐批次：费率已纠正（保司补差后封帐）
  ('df15b03','bill15trv02','bl15b03','travelers-2026-07-commission.xlsx',
   'c1001','TRV','P-2026-07003','Lakeside Dental Group',
   'rate_diff',1012.50,1050.00,-37.50,
   'resolved','resolved','rate_corrected',
   'Carrier confirmed the 2026 NV contractual rate of 14.00%; the underpaid 37.50 was topped up in the August bill. Batch locked after supervisor review.',
   NULL,
   'finance_wang',DATE '2026-07-16', 'ops_li', DATE '2026-07-18',
   'commission',
   '[{"at":"2026-07-16 10:12:00+00","by":"finance_wang","note":"Received the carrier''s correction letter by email confirming the 14.00% rate"},
     {"at":"2026-07-17 15:30:00+00","by":"ops_li","note":"Verified the top-up arrived with the August bill; approved closure and batch lock"}]'::jsonb,
   FALSE,NOW(),NOW()),
  -- 对账中批次：open × 2
  ('df15c02','bill15trv03','bl15c02','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06002','Reno Logistics Hub',
   'rate_diff',910.00,980.00,-70.00,
   'open','open','carrier_bill_error',
   'Carrier settled NV policies at the old rate of 13.00%; the 2026 contractual rate is 14.00%, underpaying 70.00. A formal request for back payment is pending.',
   NULL,
   'finance_wang',DATE '2026-06-16', NULL,NULL,
   'commission','[]'::jsonb,
   FALSE,NOW(),NOW()),
  ('df15c10','bill15trv03','bl15c10','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06010','Bay Area Ride Services',
   'rate_diff',797.50,825.00,-27.50,
   'open','open','our_calc_error',
   'Our rate table was adjusted to 15.00% in Jan 2026, but the channel still applied the old 14.50% tier when this policy was bound. Re-check after syncing the issuance system.',
   NULL,
   'finance_wang',DATE '2026-06-16', NULL,NULL,
   'commission','[]'::jsonb,
   FALSE,NOW(),NOW()),
  -- 对账中批次：suspended × 1（挂起原因 + 跟进记录）
  ('df15c04','bill15trv03','bl15c04','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06004','Seattle Coastal Living LLC',
   'amount_diff',1100.00,1150.00,-50.00,
   'suspended','suspended',NULL,
   'WA homeowners commission base definition needs tripartite verification with the channel and carrier (whether taxes and fees are included in the premium base).',
   'Waiting for the carrier''s June statement attachment; a tripartite call is scheduled before 2026-09-30 to align on the definition.',
   'finance_wang',DATE '2026-06-17', NULL,NULL,
   'commission',
   '[{"at":"2026-06-17 09:40:00+00","by":"finance_wang","note":"Contacted carrier AP by phone; they need to verify the tax/fee breakdown before responding. Case suspended for now"}]'::jsonb,
   FALSE,NOW(),NOW()),
  -- 对账中批次：resolved × 3（rate_corrected / mutual_agreed / data_confirmed）
  ('df15c07','bill15trv03','bl15c07','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06007','Phoenix Auto Fleet',
   'rate_diff',845.00,877.50,-32.50,
   'resolved','resolved','rate_corrected',
   'Carrier confirmed the AZ rate of 13.50%; the underpaid 32.50 will be topped up in the July bill.',
   NULL,
   'finance_wang',DATE '2026-06-16', 'finance_wang', DATE '2026-07-08',
   'commission',
   '[{"at":"2026-06-20 11:00:00+00","by":"finance_wang","note":"Carrier replied confirming the rate adjustment"},
     {"at":"2026-07-08 14:20:00+00","by":"finance_wang","note":"July bill includes the 32.50 top-up; closing"}]'::jsonb,
   FALSE,NOW(),NOW()),
  ('df15c08','bill15trv03','bl15c08','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06008','Portland Home Rentals LLC',
   'amount_diff',800.00,828.00,-28.00,
   'resolved','resolved','mutual_agreed',
   'Negotiated a 50/50 split; the 28.00 difference was netted out in the July bill and will not be pursued further.',
   NULL,
   'finance_wang',DATE '2026-06-18', 'ops_li', DATE '2026-07-05',
   'commission',
   '[{"at":"2026-07-05 16:10:00+00","by":"ops_li","note":"Supervisor approved the 50/50 split; carrier copied on the email"}]'::jsonb,
   FALSE,NOW(),NOW()),
  ('df15c09','bill15trv03','bl15c09','travelers-2026-06-commission.xlsx',
   'c1001','TRV','P-2026-06009','Boston Critical Care Group',
   'amount_diff',710.00,720.00,-10.00,
   'resolved','resolved','data_confirmed',
   'Per-cent rounding on the carrier bill produced a 10.00 rounding difference; line-by-line reconciliation against the base list confirmed no actual discrepancy.',
   NULL,
   'finance_wang',DATE '2026-06-16', 'finance_wang', DATE '2026-06-25',
   'commission',
   '[{"at":"2026-06-25 10:05:00+00","by":"finance_wang","note":"Checked the premiums of all 12 sub-policies line by line; confirmed as a rounding difference only"}]'::jsonb,
   FALSE,NOW(),NOW());

-- ----------------------------------------------------------------------------
-- 5) 合作-产品关联（O7 真实关联；与产品/合作主数据 carrier 一致）
-- ----------------------------------------------------------------------------
INSERT INTO cooperation_product
  (link_id, partnership_id, carrier_id, product_id, effective_from, remark,
   created_by, deleted, created_at, updated_at)
VALUES
  ('cpl15p1001','coop001','c1001','p1001',DATE '2024-01-15',
   'Initial rollout with the master agreement: CA/NV/AZ auto liability',
   'ops_li',FALSE,TIMESTAMPTZ '2024-01-15 09:00:00+00',TIMESTAMPTZ '2024-01-15 09:00:00+00'),
  ('cpl15p1005','coop001','c1001','p1005',DATE '2024-02-01',
   'Second rollout: CA/NV basic homeowners',
   'ops_li',FALSE,TIMESTAMPTZ '2024-02-01 09:00:00+00',TIMESTAMPTZ '2024-02-01 09:00:00+00'),
  ('cpl15p1010','coop001','c1001','p1010',DATE '2024-07-01',
   'Added in 2024: MA critical care health insurance (group)',
   'ops_li',FALSE,TIMESTAMPTZ '2024-07-01 09:00:00+00',TIMESTAMPTZ '2024-07-01 09:00:00+00'),
  ('cpl15p1002','coop002','c1002','p1002',DATE '2024-03-01',
   'Rolled out with the master agreement: NY/NJ/PA comprehensive auto',
   'ops_li',FALSE,TIMESTAMPTZ '2024-03-01 09:00:00+00',TIMESTAMPTZ '2024-03-01 09:00:00+00'),
  ('cpl15p1006','coop002','c1002','p1006',DATE '2024-04-15',
   'Rolled out with the master agreement: NY/CT condo comprehensive',
   'ops_li',FALSE,TIMESTAMPTZ '2024-04-15 09:00:00+00',TIMESTAMPTZ '2024-04-15 09:00:00+00');

-- p1001 存在渠道销售授权占用：coop001 取消该产品关联时应收到 409 + 占用渠道清单
INSERT INTO channel_product_authorization
  (auth_id, channel_id, product_id, carrier_id, line_of_business,
   authorized_states, grant_type, effective_date, expiration_date,
   status, created_by, deleted, created_at, updated_at)
VALUES
  ('cpa15001','c1','p1001','c1001','AUTO',
   '["CA"]'::jsonb,'permanent',DATE '2024-02-01',NULL,
   'active','ops_li',FALSE,TIMESTAMPTZ '2024-02-01 10:00:00+00',TIMESTAMPTZ '2024-02-01 10:00:00+00');

-- ----------------------------------------------------------------------------
-- 6) 续约直接登记记录（O6：无中间态；与 registerRenewal() 落库结果一致）
--    coop001 原到期 2027-01-14 → 已登记顺延一年至 2028-01-14
-- ----------------------------------------------------------------------------
INSERT INTO carrier_renewal_task
  (renewal_id, partnership_id, carrier_id, contract_id, title, expiry_date,
   priority, status, auto_renew, account_manager, last_action, last_action_at,
   deleted, created_at, updated_at,
   new_expiry_date, new_contract_id, register_note, registered_at, registered_by)
VALUES
  ('rn15reg001','coop001','c1001','contract001',
   'Travelers Master Agreement 2027 Renewal',DATE '2027-01-14',
   'normal','renewed',FALSE,'Emily Chen',
   'Renewal registered: partnership term extended in line with the master agreement to 2028-01-14',DATE '2026-09-10',
   FALSE,TIMESTAMPTZ '2026-09-05 08:30:00+00',TIMESTAMPTZ '2026-09-10 14:20:00+00',
   DATE '2028-01-14','contract001',
   'The 2027 renewal has been signed by both parties and the master agreement is extended by one year; the commission supplement (contract005) was re-signed concurrently, with rates applied per the 2026 tiers.',
   TIMESTAMPTZ '2026-09-10 14:20:00+00','ops_li');

-- 合作与合同到期日同步顺延（仅当仍为原始日期时更新，保证可重复执行）
UPDATE carrier_partnership
   SET expiration_date = DATE '2028-01-14', updated_at = TIMESTAMPTZ '2026-09-10 14:20:00+00'
 WHERE partnership_id = 'coop001' AND expiration_date = DATE '2027-01-14';

UPDATE carrier_contract
   SET expiry_date = DATE '2028-01-14'
 WHERE contract_id IN ('contract001','contract005') AND expiry_date = DATE '2027-01-14';

-- ============================================================================
-- 完成。校验查询（手工执行后预期）：
--   SELECT recon_status, COUNT(*) FROM commission_bill
--    WHERE bill_id LIKE 'bill15%' GROUP BY 1 ORDER BY 1;
--     completed | 1
--     pending   | 2
--     running   | 1
--   SELECT resolution, COUNT(*) FROM reconciliation_diff
--    WHERE diff_id LIKE 'df15%' GROUP BY 1;
--     open=2  resolved=4  suspended=1
-- ============================================================================
