-- ============================================================================
-- V1.0.13 (2026-09-13) 财务结算种子数据
--
-- 覆盖：列映射模板 3 个、保司账单 2（佣金 TRV / 保费 CHB）+ 明细、
--       我方对账单 2（含手工调整标记样例）+ 明细、对账 run 2、差异 7 条
--       （rate/premium/agent/missing/extra × open/disputed/suspended）、
--       insurer_finance_profile 运行态演示值。
--
-- 周期统一 2026-08，避开既有基线账单（2026-Q1 / 2026-09）。
-- 可重复执行：先按固定 ID 清理本批种子再插入。
-- ============================================================================

BEGIN;

-- 幂等清理（固定 ID 仅命中种子数据）
DELETE FROM reconciliation_diff WHERE run_id IN ('run13trv01', 'run13chb01');
DELETE FROM reconciliation_run  WHERE run_id IN ('run13trv01', 'run13chb01');
DELETE FROM commission_statement_line
 WHERE statement_id IN ('stmt13trv01', 'stmt13chb01');
DELETE FROM commission_statement
 WHERE statement_id IN ('stmt13trv01', 'stmt13chb01');
DELETE FROM commission_bill_line
 WHERE bill_id IN ('bill13trv01', 'bill13chb01');
DELETE FROM commission_bill
 WHERE bill_id IN ('bill13trv01', 'bill13chb01');
DELETE FROM bill_field_mapping_template
 WHERE template_id IN ('tpl13trv01', 'tpl13trvs1', 'tpl13chb01');

-- ----------------------------------------------------------------------------
-- 1) 列映射模板
-- ----------------------------------------------------------------------------
INSERT INTO bill_field_mapping_template
  (template_id, insurer_id, category, template_name, file_format, sheet_name,
   header_row, mapping_json, enabled, created_at, updated_at)
VALUES
  ('tpl13trv01', 'c1001', 'commission',
   'Travelers Monthly Commission Statement (Standard)', 'xlsx', 'Commission', 1,
   '{"headerRow":1,"sheetName":"Commission","columns":{"policy_number":"Policy No","insured_name":"Insured Name","npn":"Agent NPN","product_code":"Product Code","channel_name":"Writing Agent","state":"State","line_of_business":"LOB","premium":"Written Premium","commission_rate":"Comm Rate","commission_amount":"Commission Amt"}}'::jsonb,
   true, NOW(), NOW()),
  ('tpl13trvs1', 'c1001', 'commission',
   'In-house Statement Import Template (Commission)', 'xlsx', 'Statement', 1,
   '{"headerRow":1,"sheetName":"Statement","columns":{"policy_number":"Policy No","insured_name":"Insured Name","npn":"Agent NPN","product_code":"Product Code","channel_name":"Channel","state":"State","line_of_business":"LOB","premium":"Expected Premium","commission_rate":"Contract Rate","commission_amount":"Expected Commission"}}'::jsonb,
   true, NOW(), NOW()),
  ('tpl13chb01', 'c1002', 'premium',
   'Chubb Quarterly Premium Statement (CSV)', 'csv', NULL, 1,
   '{"headerRow":1,"columns":{"policy_number":"policy_no","insured_name":"insured","npn":"agent_npn","product_code":"product","channel_name":"producer","state":"st","line_of_business":"lob","premium":"premium_amount","commission_rate":"rate","commission_amount":"commission"}}'::jsonb,
   true, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 2) 保司账单（外部文件导入后的入库结果）
-- ----------------------------------------------------------------------------
INSERT INTO commission_bill
  (bill_id, file_name, insurer_id, insurer_name, insurer_short, period,
   import_date, imported_by, file_size, file_format, status,
   total_policies, total_premium, total_commission,
   parsed_policies, matched_policies, exception_count,
   reconciled_amount, difference_amount,
   category, source_stored_name, mapping_template_id, import_stats, period_month,
   created_at, updated_at)
VALUES
  ('bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'Travelers Insurance Company', 'TRV', '2026-08',
   NOW(), 'admin', '8.4 KB', 'xlsx', 'uploaded',
   5, 43200.00, 5684.00, 5, 0, 0, 0, 0,
   'commission', 'TRV-commission-statement-202608.xlsx', 'tpl13trv01',
   '{"total":5,"imported":5,"failed":0,"skipped":0}'::jsonb, '2026-08',
   NOW(), NOW()),
  ('bill13chb01', 'CHB-premium-202608.csv',
   'c1002', 'Chubb Limited', 'CHB', '2026-08',
   NOW(), 'admin', '0.6 KB', 'csv', 'uploaded',
   2, 51500.00, 0.00, 2, 0, 0, 0, 0,
   'premium', 'CHB-premium-202608.csv', 'tpl13chb01',
   '{"total":2,"imported":2,"failed":0,"skipped":0}'::jsonb, '2026-08',
   NOW(), NOW());

-- 2.1 账单行（仅保司侧数值；我方期望值来自对账单，入库即终态）
INSERT INTO commission_bill_line
  (line_id, bill_id, line_number, policy_number, insured_name, channel_name,
   state, line_of_business, effective_date,
   premium, commission_rate, commission_amount,
   our_policy_number, our_commission_rate, our_commission_amount,
   diff_amount, match_status, npn, product_code, category,
   deleted, created_at, updated_at)
VALUES
  -- Travelers 佣金：001 一致 / 002 费率差 / 003 保费差 / 004 代理人差 / 006 多余
  ('bl13trv01', 'bill13trv01', 1, 'P-2026-08001', 'Acme Manufacturing LLC',
   'Northstar Brokerage', 'CA', 'General Liability', '2026-08-01',
   12000.00, 0.1500, 1800.00,
   NULL, NULL, NULL, NULL, NULL,
   '1782539942', 'GL-PKG', 'commission', false, NOW(), NOW()),
  ('bl13trv02', 'bill13trv01', 2, 'P-2026-08002', 'Blue Harbor Logistics Inc',
   'Northstar Brokerage', 'CA', 'General Liability', '2026-08-01',
   9800.00, 0.1400, 1372.00,
   NULL, NULL, NULL, NULL, NULL,
   '1782539942', 'GL-PKG', 'commission', false, NOW(), NOW()),
  ('bl13trv03', 'bill13trv01', 3, 'P-2026-08003', 'Cedar Ridge Retail Group',
   'Northstar Brokerage', 'TX', 'Commercial Property', '2026-08-01',
   7600.00, 0.1200, 912.00,
   NULL, NULL, NULL, NULL, NULL,
   '1782539942', 'PROP-CP', 'commission', false, NOW(), NOW()),
  ('bl13trv04', 'bill13trv01', 4, 'P-2026-08004', 'Delta Freight Services LLC',
   'Independent Agents Inc', 'AZ', 'Commercial Auto', '2026-08-01',
   5000.00, 0.1000, 500.00,
   NULL, NULL, NULL, NULL, NULL,
   '1559830027', 'AUTO-CA', 'commission', false, NOW(), NOW()),
  ('bl13trv06', 'bill13trv01', 5, 'P-2026-08006', 'Falcon Dental Clinic PLLC',
   'Northstar Brokerage', 'WA', 'General Liability', '2026-08-01',
   8800.00, 0.1250, 1100.00,
   NULL, NULL, NULL, NULL, NULL,
   '1782539942', 'GL-PKG', 'commission', false, NOW(), NOW()),
  -- Chubb 保费：9001 一致 / 9002 保费差（9003 仅对账单有）
  ('bl13chb01', 'bill13chb01', 1, 'PP-2026-9001', 'Summit Tower Owners Assoc',
   'Metro Commercial Brokers', 'NY', 'Commercial Property', '2026-08-01',
   30000.00, 0, 0,
   NULL, NULL, NULL, NULL, NULL,
   '1204988335', 'PROP-CP', 'premium', false, NOW(), NOW()),
  ('bl13chb02', 'bill13chb01', 2, 'PP-2026-9002', 'Riverside Mall LLC',
   'Metro Commercial Brokers', 'NJ', 'Commercial Property', '2026-08-01',
   21500.00, 0, 0,
   NULL, NULL, NULL, NULL, NULL,
   '1204988335', 'PROP-CP', 'premium', false, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 3) 我方对账单（期望值，已确认可参与对账）
-- ----------------------------------------------------------------------------
INSERT INTO commission_statement
  (statement_id, insurer_id, insurer_name, insurer_short, period_month,
   category, status, source, source_stored_name,
   total_policies, total_premium, total_commission,
   confirmed_by, confirmed_at, deleted, created_at, updated_at)
VALUES
  ('stmt13trv01', 'c1001', 'Travelers Insurance Company', 'TRV', '2026-08',
   'commission', 'confirmed', 'import', 'OUR-commission-statement-202608.xlsx',
   5, 40700.00, 5470.00,
   'admin', NOW(), false, NOW(), NOW()),
  ('stmt13chb01', 'c1002', 'Chubb Limited', 'CHB', '2026-08',
   'premium', 'confirmed', 'import', 'OUR-premium-statement-202608.csv',
   3, 67000.00, 0.00,
   'admin', NOW(), false, NOW(), NOW());

INSERT INTO commission_statement_line
  (line_id, statement_id, line_number, policy_number, insured_name, npn,
   product_code, channel_name, state, line_of_business,
   premium, commission_rate, commission_amount, adjusted,
   deleted, created_at, updated_at)
VALUES
  -- 002 为手工调整样例（合同费率 15%，页面已修正留痕）；005 对账单有、账单无
  ('sl13trv01', 'stmt13trv01', 1, 'P-2026-08001', 'Acme Manufacturing LLC',
   '1782539942', 'GL-PKG', 'Northstar Brokerage', 'CA', 'General Liability',
   12000.00, 0.1500, 1800.00, false, false, NOW(), NOW()),
  ('sl13trv02', 'stmt13trv01', 2, 'P-2026-08002', 'Blue Harbor Logistics Inc',
   '1782539942', 'GL-PKG', 'Northstar Brokerage', 'CA', 'General Liability',
   9800.00, 0.1500, 1470.00, true, false, NOW(), NOW()),
  ('sl13trv03', 'stmt13trv01', 3, 'P-2026-08003', 'Cedar Ridge Retail Group',
   '1782539942', 'PROP-CP', 'Northstar Brokerage', 'TX', 'Commercial Property',
   7500.00, 0.1200, 900.00, false, false, NOW(), NOW()),
  ('sl13trv04', 'stmt13trv01', 4, 'P-2026-08004', 'Delta Freight Services LLC',
   '1559830027', 'AUTO-CA', 'Northstar Brokerage', 'AZ', 'Commercial Auto',
   5000.00, 0.1000, 500.00, false, false, NOW(), NOW()),
  ('sl13trv05', 'stmt13trv01', 5, 'P-2026-08005', 'Evergreen Nursery Co',
   '1782539942', 'PROP-CP', 'Northstar Brokerage', 'OR', 'Commercial Property',
   6400.00, 0.1250, 800.00, false, false, NOW(), NOW()),
  ('sl13chb01', 'stmt13chb01', 1, 'PP-2026-9001', 'Summit Tower Owners Assoc',
   '1204988335', 'PROP-CP', 'Metro Commercial Brokers', 'NY', 'Commercial Property',
   30000.00, 0, 0, false, false, NOW(), NOW()),
  ('sl13chb02', 'stmt13chb01', 2, 'PP-2026-9002', 'Riverside Mall LLC',
   '1204988335', 'PROP-CP', 'Metro Commercial Brokers', 'NJ', 'Commercial Property',
   22000.00, 0, 0, false, false, NOW(), NOW()),
  ('sl13chb03', 'stmt13chb01', 3, 'PP-2026-9003', 'Harbor View Condominiums',
   '1204988335', 'PROP-CP', 'Metro Commercial Brokers', 'CT', 'Commercial Property',
   15000.00, 0, 0, false, false, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 4) 对账运行批次（与上面行数据手工核算一致）
-- ----------------------------------------------------------------------------
INSERT INTO reconciliation_run
  (run_id, insurer_id, insurer_name, insurer_short, period_month, category,
   statement_id, bill_ids, status,
   total_count, matched_count, diff_count, missing_count, extra_count,
   bill_amount, our_amount, diff_amount,
   created_by, report_json, deleted, created_at, updated_at)
VALUES
  ('run13trv01', 'c1001', 'Travelers Insurance Company', 'TRV', '2026-08',
   'commission', 'stmt13trv01', '["bill13trv01"]'::jsonb, 'done',
   6, 1, 3, 1, 1,
   5684.00, 5470.00, 214.00,
   'admin',
   '{"matched":["P-2026-08001"],"rate":["P-2026-08002"],"premium":["P-2026-08003"],"agent":["P-2026-08004"],"missing":["P-2026-08005"],"extra":["P-2026-08006"]}'::jsonb,
   false, NOW(), NOW()),
  ('run13chb01', 'c1002', 'Chubb Limited', 'CHB', '2026-08',
   'premium', 'stmt13chb01', '["bill13chb01"]'::jsonb, 'done',
   3, 1, 1, 1, 0,
   51500.00, 67000.00, -15500.00,
   'admin',
   '{"matched":["PP-2026-9001"],"premium":["PP-2026-9002"],"missing":["PP-2026-9003"],"extra":[]}'::jsonb,
   false, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 5) 差异（轻量闭环：resolution + follow_ups；status 列写同值兼容过渡）
-- ----------------------------------------------------------------------------
INSERT INTO reconciliation_diff
  (diff_id, bill_id, bill_name, insurer_id, insurer_short, policy_number,
   insured_name, diff_type, bill_amount, our_amount, diff_amount,
   status, resolution, note, assigned_to, created_date, resolved_date,
   category, run_id, follow_ups, deleted, created_at, updated_at)
VALUES
  ('diff13trv02', 'bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'TRV', 'P-2026-08002', 'Blue Harbor Logistics Inc',
   'rate', 1372.00, 1470.00, -98.00,
   'open', 'open', 'Carrier bill rate 14.00% vs contractual 15.00%; commission underpaid by 98.00',
   'admin', CURRENT_DATE, NULL,
   'commission', 'run13trv01', '[]'::jsonb, false, NOW(), NOW()),
  ('diff13trv03', 'bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'TRV', 'P-2026-08003', 'Cedar Ridge Retail Group',
   'premium', 912.00, 900.00, 12.00,
   'disputed', 'disputed', 'Carrier bill premium 7,600.00 vs our booked premium 7,500.00; dispute raised',
   'admin', CURRENT_DATE, NULL,
   'commission', 'run13trv01',
   '[{"at":"2026-09-08T10:20:00Z","by":"admin","note":"Contacted carrier AP by email; awaiting the corrected bill"}]'::jsonb,
   false, NOW(), NOW()),
  ('diff13trv04', 'bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'TRV', 'P-2026-08004', 'Delta Freight Services LLC',
   'agent', 500.00, 500.00, 0.00,
   'suspended', 'suspended', 'Amounts match but the writing channel differs (Independent Agents vs Northstar); suspended to verify ownership',
   'admin', CURRENT_DATE, NULL,
   'commission', 'run13trv01', '[]'::jsonb, false, NOW(), NOW()),
  ('diff13trv05', 'bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'TRV', 'P-2026-08005', 'Evergreen Nursery Co',
   'missing', 0.00, 800.00, -800.00,
   'open', 'open', 'Present on our statement but missing from the carrier bill; suspected missed settlement',
   'admin', CURRENT_DATE, NULL,
   'commission', 'run13trv01', '[]'::jsonb, false, NOW(), NOW()),
  ('diff13trv06', 'bill13trv01', 'TRV-commission-statement-202608.xlsx',
   'c1001', 'TRV', 'P-2026-08006', 'Falcon Dental Clinic PLLC',
   'extra', 1100.00, 0.00, 1100.00,
   'open', 'open', 'Present on the carrier bill but missing from our statement; ownership to be verified',
   'admin', CURRENT_DATE, NULL,
   'commission', 'run13trv01', '[]'::jsonb, false, NOW(), NOW()),
  ('diff13chb02', 'bill13chb01', 'CHB-premium-202608.csv',
   'c1002', 'CHB', 'PP-2026-9002', 'Riverside Mall LLC',
   'premium', 21500.00, 22000.00, -500.00,
   'open', 'open', 'Carrier received 500.00 less premium than we booked',
   'admin', CURRENT_DATE, NULL,
   'premium', 'run13chb01', '[]'::jsonb, false, NOW(), NOW()),
  ('diff13chb03', 'bill13chb01', 'CHB-premium-202608.csv',
   'c1002', 'CHB', 'PP-2026-9003', 'Harbor View Condominiums',
   'missing', 0.00, 15000.00, -15000.00,
   'open', 'open', 'Our booked premium of 15,000.00 is not reflected on the carrier bill',
   'admin', CURRENT_DATE, NULL,
   'premium', 'run13chb01', '[]'::jsonb, false, NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 6) 财务运行态演示值（UPSERT；迁移已保证 7 个 config_id 齐备）
-- ----------------------------------------------------------------------------
INSERT INTO insurer_finance_profile
  (config_id, next_due_date, next_due_amount, ytd_settled,
   bank_account, routing_number, contact_email,
   notify_days_before, min_settle_amount, auto_reconcile,
   updated_at)
VALUES
  ('config001', '2026-10-25', 12480.50, 148650.00,
   'TRV-ACH-008812', '026009593', 'settlement@travelers.example',
   7, 2000.00, true, NOW()),
  ('config002', '2026-10-20', 8930.00, 62400.00,
   'CHB-AP-55201', '021000021', 'ap@chubb.example',
   5, 500.00, false, NOW())
ON CONFLICT (config_id) DO UPDATE
   SET next_due_date     = EXCLUDED.next_due_date,
       next_due_amount   = EXCLUDED.next_due_amount,
       ytd_settled       = EXCLUDED.ytd_settled,
       bank_account      = EXCLUDED.bank_account,
       routing_number    = EXCLUDED.routing_number,
       contact_email     = EXCLUDED.contact_email,
       notify_days_before = EXCLUDED.notify_days_before,
       min_settle_amount = EXCLUDED.min_settle_amount,
       auto_reconcile    = EXCLUDED.auto_reconcile,
       updated_at        = NOW();

COMMIT;
