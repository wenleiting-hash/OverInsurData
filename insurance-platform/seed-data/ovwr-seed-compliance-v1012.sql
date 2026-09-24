-- ─────────────────────────────────────────────────────────────────────
-- V1.0.12 Compliance module integration seed (idempotent)
--
-- Tables: nipr_license / license_expiry_reminder / compliance_interception
--         ofac_screening_record
-- Baseline date: 2026-09-13
-- Safe to re-run: ON CONFLICT DO NOTHING; FT-* rows are untouched.
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. NIPR licenses (10 rows: active / expiring / expired / suspended) ─

INSERT INTO nipr_license
  (license_id, channel_id, channel_name, npn_number, license_number, state, license_type,
   lines, status, issue_date, expiry_date, last_verified_at, verification_status,
   residency_state, ce_completed, ce_hours_required, ce_hours_completed,
   nipr_transaction_id, deleted, created_at, updated_at)
VALUES
  ('nlseed01','c1','Pacific Coast Insurance Group','123456789','CA-P&C-100245','CA','property_casualty',
   '["general_liability","commercial_property","commercial_auto"]'::jsonb,'active','2024-05-01','2027-05-31',
   '2026-08-20 10:12:00+00','verified','CA',TRUE,24,24,'INTSEED0001',FALSE,NOW(),NOW()),
  ('nlseed02','c2','Lone Star Brokerage','234567891','TX-GEN-200317','TX','property_casualty',
   '["commercial_auto","workers_comp"]'::jsonb,'active','2024-09-20','2026-09-20',
   '2026-08-18 09:30:00+00','verified','TX',TRUE,24,24,'INTSEED0002',FALSE,NOW(),NOW()),
  ('nlseed03','c3','Great Lakes Insurance Partners','345678912','IL-P&C-300428','IL','property_casualty',
   '["general_liability","inland_marine"]'::jsonb,'active','2024-09-28','2026-09-28',
   '2026-07-30 14:05:00+00','verified','IL',TRUE,24,24,'INTSEED0003',FALSE,NOW(),NOW()),
  ('nlseed04','c4','Empire State Insurance Services','456789123','NY-BR-400519','NY','broker',
   '["general_liability","commercial_property"]'::jsonb,'active','2024-10-08','2026-10-08',
   '2026-08-22 16:40:00+00','verified','NY',TRUE,15,15,'INTSEED0004',FALSE,NOW(),NOW()),
  ('nlseed05','c5','Sunshine State Brokers','567891234','FL-P&C-500632','FL','property_casualty',
   '["homeowners","personal_auto"]'::jsonb,'active','2024-09-10','2026-09-10',
   '2026-08-11 11:20:00+00','failed','FL',TRUE,24,24,'INTSEED0005',FALSE,NOW(),NOW()),
  ('nlseed06','c6','Midwest Specialty Risk','678912345','OH-CAS-600741','OH','casualty',
   '["workers_comp","commercial_auto"]'::jsonb,'active','2024-08-15','2026-08-15',
   '2026-07-15 08:55:00+00','failed','OH',FALSE,24,18,'INTSEED0006',FALSE,NOW(),NOW()),
  ('nlseed07','c7','Rocky Mountain Insurance Advisors','789123456','CO-P&C-700856','CO','property_casualty',
   '["general_liability"]'::jsonb,'suspended','2023-01-15','2027-01-15',
   '2026-06-10 13:00:00+00','failed','CO',FALSE,24,8,'INTSEED0007',FALSE,NOW(),NOW()),
  ('nlseed08','c8','Atlantic Coastal Risk Management','891234567','NJ-P&C-800963','NJ','property_casualty',
   '["commercial_property","general_liability"]'::jsonb,'active','2024-09-15','2026-09-15',
   NULL,'pending','NJ',FALSE,24,12,NULL,FALSE,NOW(),NOW()),
  ('nlseed09','c9','Southwest Insurance Network','912345678','AZ-P&C-901074','AZ','property_casualty',
   '["personal_auto","homeowners"]'::jsonb,'active','2026-03-31','2028-03-31',
   '2026-08-05 10:00:00+00','verified','AZ',TRUE,24,24,'INTSEED0009',FALSE,NOW(),NOW()),
  ('nlseed10','c10','Northeast Professional Services','102345679','MA-BR-101185','MA','broker',
   '["life_insurance","general_liability"]'::jsonb,'active','2024-12-20','2026-12-20',
   '2026-08-28 15:25:00+00','verified','MA',TRUE,30,30,'INTSEED0010',FALSE,NOW(),NOW())
ON CONFLICT (license_id) DO NOTHING;

-- ── 2. Interceptions (7 rows; ciseed01 is blocked & unresolved) ────────

INSERT INTO compliance_interception
  (interception_id, timestamp, channel_id, channel_name, insurer_id, insurer_short, state, line,
   policy_draft_id, customer_name, premium_amount, result, reasons, reason_descriptions,
   severity, action_type, matched_entity, list_source, match_score, rule_id, details_json,
   resolved_status, resolved_at, reviewed_by, reviewed_at, override_approved, override_note,
   release_note, deleted, created_at, updated_at)
VALUES
  ('ciseed01','2026-09-12 17:42:00+00','c2','Lone Star Brokerage',NULL,'TRAVELERS','TX','Commercial Auto',
   'pdft0001','John Mathews',2840.00,'blocked',
   '["OFAC_MATCH","LICENSE_EXPIRED"]'::jsonb,
   '["Customer name matched an OFAC SDN entry (96% match)","Agent license will expire before policy effective date"]'::jsonb,
   'critical','block_issuance','VIKTOR SOKOLOV','SDN',96.00,NULL,
   '{"engine":"builtin-sample-v1","matched_tokens":["viktor","sokolov"]}'::jsonb,
   NULL,NULL,NULL,NULL,FALSE,NULL,NULL,FALSE,NOW(),NOW()),
  ('ciseed02','2026-09-10 14:05:00+00','c5','Sunshine State Brokers',NULL,'CNA','FL','Homeowners',
   'pdft0002','Maria Gonzalez',1620.50,'blocked',
   '["LICENSE_EXPIRED"]'::jsonb,
   '["Agent license FL-P&C-500632 expired on 2026-09-10"]'::jsonb,
   'high','block_issuance',NULL,NULL,NULL,NULL,'{}'::jsonb,
   'released','2026-09-11 09:10:00+00','admin','2026-09-11 09:10:00+00',TRUE,
   'License renewal confirmed with state regulator; backdated release approved.','Release approved after renewal confirmation.',FALSE,NOW(),NOW()),
  ('ciseed03','2026-09-09 11:28:00+00','c4','Empire State Insurance Services',NULL,'CHUBB','NY','General Liability',
   'pdft0003','Riverside Cafe LLC',5400.00,'flagged',
   '["STATE_NOT_AUTHORIZED"]'::jsonb,
   '["Agent is not authorized to write this line in NY"]'::jsonb,
   'medium','manual_review',NULL,NULL,NULL,NULL,'{}'::jsonb,
   'rejected','2026-09-09 16:00:00+00','admin','2026-09-09 16:00:00+00',FALSE,
   'Authorization not granted; issuance rejected.',NULL,FALSE,NOW(),NOW()),
  ('ciseed04','2026-09-07 10:15:00+00','c6','Midwest Specialty Risk',NULL,'LIBERTY','OH','Workers Comp',
   'pdft0004','Buckeye Logistics',9800.00,'flagged',
   '["CE_INCOMPLETE"]'::jsonb,
   '["Agent CE hours 18/24 - continuing education incomplete"]'::jsonb,
   'medium','manual_review',NULL,NULL,NULL,NULL,'{}'::jsonb,
   NULL,NULL,NULL,NULL,FALSE,NULL,NULL,FALSE,NOW(),NOW()),
  ('ciseed05','2026-09-05 15:33:00+00','c8','Atlantic Coastal Risk Management',NULL,'BERKLEY','NJ','Commercial Property',
   'pdft0005','Harbor Dental Clinic',3350.75,'blocked',
   '["PRODUCT_NOT_AUTHORIZED"]'::jsonb,
   '["This product is not authorized for channel in NJ"]'::jsonb,
   'high','block_issuance',NULL,NULL,NULL,NULL,'{}'::jsonb,
   'escalated','2026-09-06 10:00:00+00','admin','2026-09-06 10:00:00+00',FALSE,
   'Escalated to channel authorization team for review.',NULL,FALSE,NOW(),NOW()),
  ('ciseed06','2026-09-03 09:47:00+00','c1','Pacific Coast Insurance Group',NULL,'HANOVER','CA','Commercial Auto',
   'pdft0006','TechNova Solutions',4200.00,'allowed',
   '["PREMIUM_MISMATCH"]'::jsonb,
   '["Quoted premium differs from rate card by 4.2% (within tolerance)"]'::jsonb,
   'low','warn',NULL,NULL,NULL,NULL,'{}'::jsonb,
   'released','2026-09-03 10:02:00+00','admin','2026-09-03 10:02:00+00',FALSE,
   NULL,'Within tolerance; released automatically.',FALSE,NOW(),NOW()),
  ('ciseed07','2026-08-29 13:19:00+00','c3','Great Lakes Insurance Partners',NULL,'ZURICH','IL','Inland Marine',
   'pdft0007','Windy City Exhibits',6100.00,'allowed',
   '[]'::jsonb,'[]'::jsonb,
   'low','pass',NULL,NULL,NULL,NULL,'{}'::jsonb,
   'released','2026-08-29 13:20:00+00','admin','2026-08-29 13:20:00+00',FALSE,
   NULL,'Auto pass.',FALSE,NOW(),NOW())
ON CONFLICT (interception_id) DO NOTHING;

-- ── 3. OFAC screening records (2 unreviewed rows for review flow) ──────

INSERT INTO ofac_screening_record
  (screening_id, timestamp, entity_name, entity_type, country, date_of_birth,
   identification_number, address, screened_by, result, match_score, match_score_level,
   matched_entry, matched_list, program, policy_id, reviewed_by, review_note,
   override_approved, review_date, details_json, deleted, created_at, updated_at)
VALUES
  ('ofseed01','2026-09-12 18:05:00+00','Viktor Sokolov','individual','RU','1974-03-22',
   NULL,'Moscow, RU','admin','blocked',96.00,'high',
   'VIKTOR SOKOLOV','SDN','["RUSSIA-EO14024"]'::jsonb,'pdft0001',
   NULL,NULL,FALSE,NULL,
   '{"engine":"builtin-sample-v1","normalized":"viktor sokolov","matched_tokens":["viktor","sokolov"]}'::jsonb,
   FALSE,NOW(),NOW()),
  ('ofseed02','2026-09-11 09:52:00+00','Ahmed Masri','individual','EG','1981-11-08',
   NULL,'Cairo, EG','admin','watchlist',62.00,'medium',
   'AHMED AL MASRI','SDN','["SDGT"]'::jsonb,NULL,
   NULL,NULL,FALSE,NULL,
   '{"engine":"builtin-sample-v1","normalized":"ahmed masri","matched_tokens":["masri"]}'::jsonb,
   FALSE,NOW(),NOW())
ON CONFLICT (screening_id) DO NOTHING;

-- ── 4. Historical "sent" reminders ─────────────────────────────────────
-- Use the SAME deterministic ids the lazy sync generates (md5(license:window))
-- so ON CONFLICT DO NOTHING inside the service keeps these sent rows intact.

INSERT INTO license_expiry_reminder
  (reminder_id, license_id, channel_id, channel_name, days_before, notify_at,
   status, sent_at, acknowledged_at, deleted, created_at, updated_at)
SELECT md5('nlseed05:30'), 'nlseed05','c5','Sunshine State Brokers',30,
       TIMESTAMP '2026-08-11 08:00:00+00','sent',TIMESTAMP '2026-08-11 08:00:05+00',
       TIMESTAMP '2026-08-11 09:12:00+00',FALSE,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM license_expiry_reminder WHERE reminder_id = md5('nlseed05:30'));

INSERT INTO license_expiry_reminder
  (reminder_id, license_id, channel_id, channel_name, days_before, notify_at,
   status, sent_at, acknowledged_at, deleted, created_at, updated_at)
SELECT md5('nlseed06:7'), 'nlseed06','c6','Midwest Specialty Risk',7,
       TIMESTAMP '2026-08-08 08:00:00+00','sent',TIMESTAMP '2026-08-08 08:00:04+00',
       NULL,FALSE,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM license_expiry_reminder WHERE reminder_id = md5('nlseed06:7'));

COMMIT;

-- ── Verification ───────────────────────────────────────────────────────
-- SELECT (SELECT count(*) FROM nipr_license WHERE license_id LIKE 'nlseed%') AS licenses,
--        (SELECT count(*) FROM compliance_interception WHERE interception_id LIKE 'ciseed%') AS interceptions,
--        (SELECT count(*) FROM ofac_screening_record WHERE screening_id LIKE 'ofseed%') AS ofac;
