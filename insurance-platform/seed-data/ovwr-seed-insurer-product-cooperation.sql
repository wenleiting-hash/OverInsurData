-- ==========================================================================
-- 保险公司 + 产品 + 合作管理 数据库建表 + 种子数据
-- 目标容器: OVERINSURDATA (port 5433, db: overinsur_db)
-- 幂等: DROP IF EXISTS + CREATE, INSERT ON CONFLICT DO NOTHING
-- ==========================================================================

-- ========== 1. insurance_carrier ==========
DROP TABLE IF EXISTS carrier_settlement_config CASCADE;
DROP TABLE IF EXISTS carrier_contact CASCADE;
DROP TABLE IF EXISTS carrier_contract CASCADE;
DROP TABLE IF EXISTS carrier_partnership CASCADE;
DROP TABLE IF EXISTS insurance_product CASCADE;
DROP TABLE IF EXISTS insurance_carrier CASCADE;

CREATE TABLE insurance_carrier (
  carrier_id        VARCHAR(32) PRIMARY KEY,
  naic_code         VARCHAR(8) NOT NULL UNIQUE,
  carrier_name      VARCHAR(128) NOT NULL,
  carrier_name_short VARCHAR(64),
  carrier_type      VARCHAR(16) DEFAULT 'ADMITTED',
  status            VARCHAR(16) DEFAULT 'active',
  region            VARCHAR(32),
  state             VARCHAR(4),
  coop_type         VARCHAR(32),
  coop_status       VARCHAR(16) DEFAULT 'active',
  founded_year      INTEGER,
  website           VARCHAR(256),
  loss_ratio        NUMERIC(5,4),
  renewal_rate      NUMERIC(5,4),
  revenue           BIGINT,
  policy_count      INTEGER,
  commission_income BIGINT,
  am_best_rating    VARCHAR(8),
  sp_rating         VARCHAR(8),
  moodys_rating     VARCHAR(8),
  fitch_rating      VARCHAR(8),
  settlement_cycle  VARCHAR(16) DEFAULT 'Monthly',
  contract_expiry   DATE,
  channel_count     INTEGER DEFAULT 0,
  product_count     INTEGER DEFAULT 0,
  lines             JSONB DEFAULT '[]',
  deleted           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_carrier_status ON insurance_carrier(status);
CREATE INDEX idx_carrier_region ON insurance_carrier(region);

-- ========== 2. insurance_product ==========
CREATE TABLE insurance_product (
  product_id          VARCHAR(32) PRIMARY KEY,
  carrier_id          VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  naic_code           VARCHAR(32),
  product_name        VARCHAR(128) NOT NULL,
  short_name          VARCHAR(64),
  product_code        VARCHAR(32) NOT NULL UNIQUE,
  naic_form_number    VARCHAR(32),
  description         TEXT,
  description_en      TEXT,
  coverages           JSONB DEFAULT '[]',
  line_of_business    VARCHAR(16) NOT NULL,
  sub_line            VARCHAR(32),
  product_type        VARCHAR(32),
  insurer_name        VARCHAR(128),
  underwriting_mode   VARCHAR(16) DEFAULT 'Auto',
  max_policy_limit    NUMERIC(12,2),
  mga_negotiation     BOOLEAN DEFAULT FALSE,
  renewal_type        VARCHAR(32),
  policy_term_years   INTEGER,
  age_min             INTEGER,
  age_max             INTEGER,
  exclude_dui         BOOLEAN DEFAULT FALSE,
  refer_high_value    BOOLEAN DEFAULT FALSE,
  refer_threshold     NUMERIC(12,2),
  blacklist_conditions JSONB DEFAULT '[]',
  available_states    JSONB DEFAULT '[]',
  effective_date      DATE,
  expiration_date     DATE,
  status              VARCHAR(16) DEFAULT 'Active',
  is_active           BOOLEAN DEFAULT TRUE,
  rate_type           VARCHAR(16),
  base_rate           NUMERIC(10,4),
  min_premium         NUMERIC(10,2),
  max_premium         NUMERIC(10,2),
  rate_factors        JSONB DEFAULT '[]',
  premium_ytd         NUMERIC(14,2) DEFAULT 0,
  policy_count        INTEGER DEFAULT 0,
  avg_premium         NUMERIC(10,2) DEFAULT 0,
  loss_ratio          NUMERIC(5,4) DEFAULT 0,
  renewal_rate        NUMERIC(5,4) DEFAULT 0,
  documents           JSONB DEFAULT '[]',
  deleted             BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_product_carrier ON insurance_product(carrier_id);
CREATE INDEX idx_product_lob ON insurance_product(line_of_business);
CREATE INDEX idx_product_status ON insurance_product(status);

-- ========== 3. carrier_partnership ==========
CREATE TABLE carrier_partnership (
  partnership_id        VARCHAR(32) PRIMARY KEY,
  carrier_id            VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  cooperation_type      VARCHAR(32),
  status                VARCHAR(32) DEFAULT 'Draft',
  commission_tier       VARCHAR(16),
  notes                 TEXT,
  notes_en              TEXT,
  settlement_method     VARCHAR(32),
  settlement_cycle_days INTEGER DEFAULT 30,
  premium_collection    VARCHAR(32),
  premium_settlement    VARCHAR(32),
  effective_date        DATE,
  expiration_date       DATE,
  product_scope         JSONB DEFAULT '{}',
  state_scope           JSONB DEFAULT '[]',
  contract_file         JSONB,
  created_by            VARCHAR(64),
  deleted               BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_partnership_carrier ON carrier_partnership(carrier_id);
CREATE INDEX idx_partnership_status ON carrier_partnership(status);

-- ========== 4. carrier_contract ==========
CREATE TABLE carrier_contract (
  contract_id       VARCHAR(32) PRIMARY KEY,
  partnership_id    VARCHAR(32) REFERENCES carrier_partnership(partnership_id),
  carrier_id        VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  title             VARCHAR(256) NOT NULL,
  title_en          VARCHAR(256),
  contract_type     VARCHAR(32),
  version           VARCHAR(16),
  effective_date    DATE,
  expiry_date       DATE,
  signatory_us      VARCHAR(128),
  signatory_them    VARCHAR(128),
  status            VARCHAR(32) DEFAULT 'draft',
  auto_renew        BOOLEAN DEFAULT FALSE,
  tags              JSONB DEFAULT '[]',
  tags_en           JSONB DEFAULT '[]',
  file_url          VARCHAR(512),
  deleted           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========== 5. carrier_contact ==========
CREATE TABLE carrier_contact (
  contact_id        VARCHAR(32) PRIMARY KEY,
  carrier_id        VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  partnership_id    VARCHAR(32) REFERENCES carrier_partnership(partnership_id),
  first_name        VARCHAR(64),
  last_name         VARCHAR(64),
  full_name         VARCHAR(128) NOT NULL,
  position          VARCHAR(100),
  department        VARCHAR(100),
  role              VARCHAR(32),
  email             VARCHAR(128),
  phone             VARCHAR(32),
  mobile_phone      VARCHAR(32),
  office_address    VARCHAR(256),
  is_active         BOOLEAN DEFAULT TRUE,
  is_primary        BOOLEAN DEFAULT FALSE,
  created_by        VARCHAR(64),
  deleted           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ========== 6. carrier_settlement_config ==========
CREATE TABLE carrier_settlement_config (
  config_id             VARCHAR(32) PRIMARY KEY,
  carrier_id            VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  partnership_id        VARCHAR(32) REFERENCES carrier_partnership(partnership_id),
  cycle                 VARCHAR(16) DEFAULT 'Monthly',
  bill_cutoff_day       INTEGER DEFAULT 25,
  payment_term_days     INTEGER DEFAULT 30,
  payment_method        VARCHAR(16) DEFAULT 'ACH',
  billing_format        VARCHAR(16) DEFAULT 'EDI',
  api_enabled           BOOLEAN DEFAULT FALSE,
  premium_collection    VARCHAR(16) DEFAULT 'AgencyBill',
  updated_by            VARCHAR(64),
  last_updated          DATE,
  deleted               BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- SEED DATA: insurance_carrier (22 records from mockDashboardData.ts)
-- ==========================================================================
INSERT INTO insurance_carrier (carrier_id, naic_code, carrier_name, carrier_name_short, carrier_type, status, region, state, coop_type, coop_status, founded_year, website, loss_ratio, renewal_rate, revenue, policy_count, commission_income, am_best_rating, sp_rating, moodys_rating, fitch_rating, settlement_cycle, contract_expiry, channel_count, product_count, lines) VALUES
('c1001','25658','Travelers Insurance Company','Travelers','Admitted','active','National','CT','direct','active',1853,'www.travelers.com',0.58,0.92,1850000000,52800,12500000,'A++','AA-','Aa2','AA-','Monthly','2027-03-31',156,12,'["P&C","Commercial","Auto","Home"]'),
('c1002','12345','Chubb Limited','Chubb','Admitted','active','National','NJ','mga','active',1882,'www.chubb.com',0.62,0.89,1480000000,45600,10000000,'A+','A+','A1','A+','Monthly','2026-12-31',128,10,'["Commercial","Cyber","Property"]'),
('c1003','34567','Liberty Mutual Insurance Group','Liberty Mutual','Admitted','active','National','MA','wholesale','expiring',1912,'www.libertymutual.com',0.64,0.88,1230000000,38500,8400000,'A','A','A2','A','Quarterly','2026-09-30',96,9,'["Auto","Home","Commercial"]'),
('c1004','45678','Nationwide Mutual Insurance Company','Nationwide','Admitted','active','National','OH','independent','active',1926,'www.nationwide.com',0.61,0.90,1150000000,42000,9200000,'A+','A','A1','A+','Monthly','2027-06-30',104,9,'["Auto","Home","Life","Commercial"]'),
('c1005','56789','State Farm Mutual Automobile Insurance Company','State Farm','Admitted','active','National','IL','direct','active',1922,'www.statefarm.com',0.59,0.93,1680000000,58000,13800000,'A++','AA-','Aa3','AA-','Monthly','2027-01-31',142,8,'["Auto","Home","Life"]'),
('c1006','67890','The Hartford Fire Insurance Company','The Hartford','Admitted','active','National','CT','mga','active',1810,'www.thehartford.com',0.63,0.87,980000000,32000,7200000,'A','A-','A3','A-','Quarterly','2026-11-30',88,7,'["Commercial","Workers Comp"]'),
('c1007','78901','Allstate Insurance Company','Allstate','Admitted','active','National','IL','independent','active',1931,'www.allstate.com',0.60,0.91,1320000000,48000,11000000,'A+','A+','A1','A+','Monthly','2027-04-30',118,8,'["Auto","Home"]'),
('c1008','89012','Progressive Direct Insurance Company','Progressive','Admitted','active','National','OH','direct','active',1937,'www.progressive.com',0.65,0.86,1540000000,55000,12000000,'A+','A','A2','A','Monthly','2027-08-31',134,6,'["Auto","Home","Commercial"]'),
('c1009','90123','Farmers Group Inc.','Farmers Insurance','Admitted','active','West','CA','independent','active',1900,'www.farmers.com',0.62,0.88,1080000000,39000,8800000,'A','A','A2','A','Quarterly','2026-12-31',92,9,'["Auto","Home","Life"]'),
('c1010','01234','Metropolitan Property and Casualty Insurance Company','MetLife P&C','Admitted','active','Northeast','NY','mga','active',1868,'www.metlife.com',0.57,0.94,720000000,28000,6500000,'A+','A+','A1','A+','Monthly','2027-02-28',64,6,'["Auto","Home","Property"]'),
('c1011','11223','Excess and Surplus Solutions LLC','ESS','Non-Admitted','active','Southeast','FL','wholesale','active',2005,'www.exsurplus.com',0.68,0.82,450000000,18000,5200000,'BBB+','BBB+','Ba1','BBB+','Monthly','2026-10-31',22,4,'["E&S","Specialty"]'),
('c1012','22334','Catastrophe Reinsurance Partners','CRP','Non-Admitted','active','National','TX','wholesale','active',2010,'www.catreins.com',0.72,0.78,380000000,12000,4800000,'BBB','BBB','Baa3','BBB','Quarterly','2027-05-31',12,3,'["Reinsurance"]'),
('c1013','33445','High Risk Coverage Specialists','HRC','Non-Admitted','pending','Midwest','IL','wholesale','pending',2015,'www.highriskcoverage.com',0.75,0.75,280000000,9500,3200000,'BB+','BB+','Ba2','BBB-','Monthly','2026-12-31',18,3,'["Specialty","E&S"]'),
('c1014','44556','Cyber Liability Underwriters','CLU','Non-Admitted','active','West','CA','wholesale','active',2012,'www.cyberliability.com',0.55,0.95,520000000,22000,6800000,'A-','A-','A3','A-','Monthly','2027-09-30',26,5,'["Cyber","Tech E&O"]'),
('c1015','55667','Professional Indemnity Exchange','PIE','Non-Admitted','inactive','Northeast','NY','wholesale','suspended',2008,'www.profindem.com',0.70,0.80,350000000,14000,4200000,'BBB-','BBB-','Baa1','BBB-','Quarterly','2026-06-30',14,3,'["Professional Liability"]'),
('c1016','66778','American Family Mutual Insurance Company','AmFam','Admitted','active','Midwest','WI','direct','active',1926,'www.amfam.com',0.59,0.90,890000000,34000,7800000,'A','A','A2','A','Monthly','2027-03-31',78,7,'["Auto","Home","Life"]'),
('c1017','77889','Safeco Insurance Company of Illinois','Safeco','Admitted','pending','West','CO','direct','pending',1895,'www.safeco.com',0.61,0.88,620000000,25000,5600000,'A-','A-','A3','A-','Quarterly','2026-11-30',56,6,'["Auto","Home"]'),
('c1018','88990','Erie Insurance Exchange','Erie','Admitted','active','Northeast','OH','independent','active',1925,'www.erieinsurance.com',0.58,0.92,540000000,21000,4900000,'A+','A+','A1','A+','Monthly','2027-07-31',48,6,'["Auto","Home","Commercial"]'),
('c1019','99001','Auto-Owners Insurance Company','Auto-Owners','Admitted','active','Midwest','MI','direct','active',1916,'www.auto-owners.com',0.56,0.93,710000000,29000,6700000,'A++','AA-','Aa2','AA-','Monthly','2027-02-28',52,7,'["Auto","Home","Life","Commercial"]'),
('c1020','00112','UCO Insurance Company','UCO','Admitted','pending','Southeast','SC','independent','pending',1974,'www.ucoinsurance.com',0.63,0.85,380000000,15000,3800000,'A','A','A2','A','Quarterly','2026-12-31',24,4,'["Auto","Property"]'),
('c1021','11224','National Service Insurance Company','NSIC','Admitted','inactive','National','CA','independent','suspended',1969,'www.nsico.com',0.66,0.84,420000000,17000,4100000,'A-','A-','A3','A-','Monthly','2026-05-31',30,4,'["Auto","Commercial"]'),
('c1022','22335','Shelter Mutual Insurance Company','Shelter','Admitted','active','Southwest','MO','independent','active',1929,'www.shelterins.com',0.60,0.89,490000000,20000,4600000,'A','A','A2','A','Quarterly','2027-04-30',44,5,'["Auto","Home"]')
ON CONFLICT (carrier_id) DO NOTHING;

-- ==========================================================================
-- SEED DATA: insurance_product (10 records from mockProductData.ts)
-- ==========================================================================
INSERT INTO insurance_product (product_id, carrier_id, naic_code, product_name, short_name, product_code, naic_form_number, description, description_en, coverages, line_of_business, sub_line, product_type, insurer_name, underwriting_mode, max_policy_limit, mga_negotiation, renewal_type, policy_term_years, age_min, age_max, exclude_dui, refer_high_value, refer_threshold, blacklist_conditions, available_states, effective_date, expiration_date, status, is_active, rate_type, base_rate, min_premium, max_premium, rate_factors, premium_ytd, policy_count, avg_premium, loss_ratio, renewal_rate) VALUES
('p1001','c1001','CA-auto-liability','California Auto Liability Insurance Plan','CAL Auto Liability','CA-LIAB-2026','CA-12345','覆盖加州、内华达、亚利桑那三州的标准汽车责任险产品','Standard auto liability product covering CA, NV, and AZ','["Liability","UninsuredMotorist","RoadsideAssistance"]','AUTO','Liability','Individual','Travelers','Auto',500000,false,'Guaranteed',1,18,75,true,true,1000000,'["poorCredit","fraudHistory"]','["CA","NV","AZ"]','2024-01-15','2027-12-31','Active',true,'Tiered',1240,480,4200,'["DrivingRecord","VehicleType","Age","CreditScore","Region"]',12500000,8500,1470,0.58,0.92),
('p1002','c1002','NY-auto-comprehensive','New York Auto Comprehensive Coverage','NY Auto Comp','NY-COMP-2026','NY-67890','纽约州综合汽车保险','New York comprehensive auto coverage','["Comprehensive","Collision","VehicleReplacement"]','AUTO','Comprehensive','Individual','Chubb','Auto',750000,false,'Guaranteed',1,21,65,true,false,NULL,'["mispresentation"]','["NY","NJ","PA"]','2024-03-01','2027-12-31','Active',true,'Tiered',1435,520,4800,'["DrivingRecord","VehicleType","Age","CreditScore"]',8900000,6200,1435,0.62,0.89),
('p1003','c1005','TX-auto-collision','Texas Auto Collision Protection','TX Auto Collision','TX-COLL-2026','TX-11223','德州汽车碰撞损失保障','Texas auto collision protection','["Collision","MedicalPayments"]','AUTO','Collision','Group','State Farm','Manual',1000000,true,'Conditional',2,21,70,true,true,1200000,'["fraudHistory","mispresentation"]','["TX","OK","LA"]','2024-06-01','2026-12-31','Active',true,'Tiered',1592,600,5200,'["DrivingRecord","VehicleValue","AccidentHistory","Region"]',15600000,9800,1592,0.55,0.94),
('p1004','c1006','FL-auto-medical','Florida Auto Medical Payments Plan','FL Auto MedPay','FL-MED-2026','FL-44556','佛罗里达州医疗赔付补充保障','Florida medical payments supplement','["MedicalPayments"]','AUTO','Medical Payments','Individual','The Hartford','Auto',250000,false,'Guaranteed',1,18,75,true,false,NULL,'["mispresentation"]','["FL","GA","AL"]','2025-01-10','2028-12-31','Pending',false,'Flat',1400,300,2500,'["Age","AccidentHistory"]',2100000,1500,1400,0.60,0.85),
('p1005','c1001','CA-homeowners-basic','California Homeowners Basic Package','CA Home Basic','CA-HOME-2026','CA-78901','加州基础房屋保险套餐','California basic homeowners package','[]','HOME','Dwelling','Individual','Travelers','Auto',2000000,false,'Guaranteed',1,21,80,false,true,2000000,'["poorCredit","fraudHistory"]','["CA","NV"]','2024-02-01','2027-12-31','Active',true,'Tiered',1542,650,8500,'["Region","SafetyEquipment","AccidentHistory"]',18500000,12000,1542,0.52,0.95),
('p1006','c1002','NY-condo-comprehensive','New York Condo Owners Comprehensive','NY Condo Comp','NY-CONDO-2026','NY-23456','纽约公寓业主综合保障','New York condo owners comprehensive','[]','HOME','Condo','Individual','Chubb','Auto',1500000,false,'Guaranteed',1,25,75,false,true,1500000,'["poorCredit"]','["NY","CT"]','2024-04-15','2027-12-31','Active',true,'Tiered',1436,580,7200,'["Region","SafetyEquipment"]',11200000,7800,1436,0.48,0.93),
('p1007','c1008','WA-renters-insurance','Washington Renters Insurance Plan','WA Renters','WA-RENT-2026','WA-34567','华盛顿州租客保险计划','Washington renters insurance plan','[]','HOME','Renters','Individual','Progressive','Auto',500000,false,'Guaranteed',1,18,70,false,false,NULL,'["poorCredit"]','["WA","OR","AK"]','2025-03-01','2028-12-31','Active',true,'Flat',1071,240,3600,'["Region","SafetyEquipment","CreditScore"]',4500000,4200,1071,0.45,0.91),
('p1008','c1005','IL-term-life-standard','Illinois Term Life Standard Coverage','IL Term Life','IL-LIFE-2026','IL-56789','伊利诺伊州定期寿险标准方案','Illinois term life standard plan','[]','LIFE','Term Life','Individual','State Farm','Auto',5000000,false,'Non-Renewable',10,18,65,true,true,3000000,'["fraudHistory"]','["IL","IN","WI","MI"]','2024-01-20','2027-12-31','Active',true,'Tiered',1500,800,12000,'["Age","AgeBracket","AccidentHistory"]',22500000,15000,1500,0.42,0.78),
('p1009','c1007','OH-whole-life-premium','Ohio Whole Life Premium Plan','OH Whole Life','OH-WHOLE-2026','OH-67890','俄亥俄州终身寿险高端方案','Ohio whole life premium plan','[]','LIFE','Whole Life','Individual','Allstate','Manual',10000000,false,'Non-Renewable',30,30,70,true,false,NULL,'["fraudHistory","mispresentation"]','["OH","PA","KY","WV"]','2024-05-01','2027-12-31','Paused',false,'Tiered',1976,1200,25000,'["Age","AgeBracket","AccidentHistory"]',16800000,8500,1976,0.38,0.82),
('p1010','c1001','MA-health-critical-care','Massachusetts Critical Care Health Insurance','MA Critical Care','MA-HEALTH-2026','MA-89012','马萨诸塞州重疾健康保险','Massachusetts critical care health insurance','[]','HEALTH','Critical Illness','Group','Travelers','Auto',3000000,false,'Guaranteed',1,18,65,false,false,NULL,'["mispresentation"]','["MA","CT","RI","NH","VT","ME"]','2024-07-01','2027-12-31','Active',true,'Flat',1885,500,8000,'["AgeBracket"]',9800000,5200,1885,0.65,0.88)
ON CONFLICT (product_id) DO NOTHING;

-- ==========================================================================
-- SEED DATA: carrier_partnership (7 records from mockCooperationData.ts)
-- ==========================================================================
INSERT INTO carrier_partnership (partnership_id, carrier_id, cooperation_type, status, commission_tier, notes, notes_en, settlement_method, settlement_cycle_days, premium_collection, premium_settlement, effective_date, expiration_date, product_scope, state_scope, contract_file, created_by) VALUES
('coop001','c1001','Full-Service','Approved','Tier-1',NULL,NULL,'DirectPay',45,'ChannelToMyToInsurer','Monthly','2024-01-15','2027-01-14','{"type":"SpecificLOB","lobTypes":["AUTO","HOME"]}','["CA","NV","AZ","OR","WA"]','{"fileName":"Master_Agreement_Travelers_2024.pdf","fileSize":2548000}','user_admin'),
('coop002','c1002','Specialty','Approved','Tier-2',NULL,NULL,'PlatformSettle',30,'ChannelToMyToInsurer','Weekly','2023-06-01','2026-05-31','{"type":"All"}','["IL","IN","OH","GA","NC"]','{"fileName":"MGA_Agreement_Allstate_2023.pdf","fileSize":3124000}','user_admin'),
('coop003','c1003','Preferred','Approved','Tier-2',NULL,NULL,'DirectPay',60,'ChannelDirectToInsurer','Monthly','2021-03-01','2025-09-30','{"type":"SpecificLOB","lobTypes":["HOME","AUTO"]}','["TX","OK","NM","LA","AR"]','{"fileName":"Wholesale_Master_Mapfre_2021.pdf","fileSize":1876000}','user_admin'),
('coop004','c1004','Full-Service','Approved','Tier-1','合同即将到期，续约谈判进行中','Contract expiring soon; renewal negotiation in progress','PlatformSettle',45,'ChannelToMyToInsurer','Monthly','2025-11-01','2028-10-31','{"type":"SpecificLOB","lobTypes":["AUTO","LIFE"]}','["MA","NH","VT","ME"]',NULL,'user_partnership_mgr'),
('coop005','c1005','Surplus Lines','Approved','Tier-3',NULL,NULL,'PlatformSettle',30,'ChannelToMyToInsurer','Weekly','2024-05-01','2027-04-30','{"type":"All"}','["CA","NY","NJ","CT","PA","FL"]','{"fileName":"Aggregator_Integration_Agreement_MetLife_2024.pdf","fileSize":4567000}','user_admin'),
('coop006','c1001','Specialty','UnderReview','Tier-2','新合作申请，合规审核中','New partnership application under compliance review','PlatformSettle',45,'ChannelToMyToInsurer','Monthly',NULL,NULL,'{"type":"SpecificLOB","lobTypes":["CYBER","D_O","E_O"]}','["NY","DE","CA"]',NULL,'user_admin'),
('coop007','c1002','Surplus Lines','Terminated',NULL,NULL,NULL,'PlatformSettle',45,'ChannelToMyToInsurer','Monthly','2023-01-01','2025-12-31','{"type":"SpecificLOB","lobTypes":["COMMERCIAL"]}','["CA","NV","AZ"]',NULL,'user_admin')
ON CONFLICT (partnership_id) DO NOTHING;

-- ==========================================================================
-- SEED DATA: carrier_contract (5 records)
-- ==========================================================================
INSERT INTO carrier_contract (contract_id, partnership_id, carrier_id, title, title_en, contract_type, version, effective_date, expiry_date, signatory_us, signatory_them, status, auto_renew, tags, tags_en) VALUES
('contract001','coop001','c1001','主合作协议 - Travelers','Master Agreement - Travelers','Master','v2.1','2024-01-15','2027-01-14','InsureOS Inc.','Travelers Insurance Company','active',true,'["核心协议","自动续"]','["Core Agreement","Auto-Renew"]'),
('contract002','coop002','c1002','产品补充协议 - Chubb','Product Supplement - Chubb','Supplement','v1.3','2023-06-01','2026-05-31','InsureOS Inc.','Chubb Limited','active',false,'["Cyber","Property"]','["Cyber","Property"]'),
('contract003','coop003','c1003','保密协议 NDA - Liberty Mutual','NDA - Liberty Mutual','NDA','v1.0','2021-03-01','2025-09-30','InsureOS Inc.','Liberty Mutual Insurance Group','expiring',false,'["保密","即将到期"]','["Confidential","Expiring Soon"]'),
('contract004','coop005','c1005','数据处理协议 DPA - State Farm','Data Processing Agreement - State Farm','DPA','v1.2','2024-05-01','2027-04-30','InsureOS Inc.','State Farm Mutual Automobile Insurance Company','active',true,'["数据合规","GDPR"]','["Data Compliance","GDPR"]'),
('contract005','coop001','c1001','佣金补充协议 - Travelers','Commission Supplement - Travelers','Commission','v1.5','2024-04-10','2027-01-14','InsureOS Inc.','Travelers Insurance Company','active',false,'["佣金","Tier-1"]','["Commission","Tier-1"]')
ON CONFLICT (contract_id) DO NOTHING;

-- ==========================================================================
-- SEED DATA: carrier_contact (10 records - my contacts + insurer contacts)
-- ==========================================================================
INSERT INTO carrier_contact (contact_id, carrier_id, partnership_id, first_name, last_name, full_name, position, department, role, email, phone, mobile_phone, office_address, is_active, is_primary, created_by) VALUES
-- My contacts
('contact001','c1001','coop001','John','Williams','John Williams','VP of Partnerships','Business Development','AccountManager','john.williams@ourcompany.com','+1-415-555-0101','+1-415-555-0102','San Francisco, CA',true,true,'user_admin'),
('contact002','c1002','coop002','Emily','Chen','Emily Chen','Head of MGA Partnerships','Strategic Partnerships','AccountManager','emily.chen@ourcompany.com','+1-650-555-0101',NULL,'Menlo Park, CA',true,true,'user_admin'),
('contact003','c1003','coop003','David','Martinez','David Martinez','Director of Wholesale Partnerships','Business Development','AccountManager','david.martinez@ourcompany.com','+1-214-555-0101',NULL,'Dallas, TX',true,true,'user_admin'),
('contact004','c1004','coop004','Lisa','Anderson','Lisa Anderson','Senior Partnership Manager','Business Development','AccountManager','lisa.anderson@ourcompany.com','+1-617-555-0101',NULL,'Boston, MA',true,true,'user_partnership_mgr'),
('contact005','c1005','coop005','Kevin','Wang','Kevin Wang','Chief Technology Officer','Technology','IT','kevin.wang@ourcompany.com','+1-408-555-0101',NULL,'Mountain View, CA',true,true,'user_admin'),
-- Insurer contacts
('ic001','c1001','coop001','Sarah','Johnson','Sarah Johnson','Regional President - West Coast','Sales','AccountManager','sarah.johnson@travelers.com','+1-415-555-0201',NULL,'San Francisco, CA',true,true,'user_admin'),
('ic002','c1002','coop002','Michael','Thompson','Michael Thompson','CEO','Executive','Executive','m.thompson@allstate.com','+1-312-555-0201',NULL,'Chicago, IL',true,true,'user_admin'),
('ic003','c1003','coop003','Jennifer','Lee','Jennifer Lee','Wholesale Sales Director','Sales','AccountManager','jennifer.lee@mapfre.com','+1-214-555-0201',NULL,'Dallas, TX',true,true,'user_admin'),
('ic004','c1004','coop004','Robert','Brown','Robert Brown','VP Business Development','Strategy','AccountManager','r.brown@libertymutual.com','+1-617-555-0201',NULL,'Boston, MA',true,true,'user_partnership_mgr'),
('ic005','c1005','coop005','Amanda','Stewart','Amanda Stewart','VP Engineering','Engineering','IT','amanda.stewart@metlife.com','+1-203-555-0201',NULL,'Hartford, CT',true,true,'user_admin')
ON CONFLICT (contact_id) DO NOTHING;

-- ==========================================================================
-- SEED DATA: carrier_settlement_config (5 records)
-- ==========================================================================
INSERT INTO carrier_settlement_config (config_id, carrier_id, partnership_id, cycle, bill_cutoff_day, payment_term_days, payment_method, billing_format, api_enabled, premium_collection, updated_by, last_updated) VALUES
('config001','c1001','coop001','Monthly',25,30,'ACH','EDI',true,'AgencyBill','Emily Chen','2024-08-15'),
('config002','c1002','coop002','Quarterly',20,45,'Wire','Excel',false,'DirectBill','Kevin Wang','2024-07-20'),
('config003','c1003','coop003','Monthly',28,30,'EFT','API',true,'AgencyBill','Michael Thompson','2024-06-10'),
('config004','c1005','coop005','Monthly',25,30,'ACH','EDI',true,'AgencyBill','Lisa Anderson','2024-09-01'),
('config005','c1004','coop004','Quarterly',15,45,'Wire','Excel',false,'DirectBill','David Martinez','2025-01-10')
ON CONFLICT (config_id) DO NOTHING;

-- ========== Summary ==========
SELECT 'insurance_carrier: ' || COUNT(*) || ' rows' AS summary FROM insurance_carrier
UNION ALL SELECT 'insurance_product: ' || COUNT(*) || ' rows' FROM insurance_product
UNION ALL SELECT 'carrier_partnership: ' || COUNT(*) || ' rows' FROM carrier_partnership
UNION ALL SELECT 'carrier_contract: ' || COUNT(*) || ' rows' FROM carrier_contract
UNION ALL SELECT 'carrier_contact: ' || COUNT(*) || ' rows' FROM carrier_contact
UNION ALL SELECT 'carrier_settlement_config: ' || COUNT(*) || ' rows' FROM carrier_settlement_config;
