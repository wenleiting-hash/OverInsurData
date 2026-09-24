-- ============================================================================
-- V1.0.17 (2026-09-18)
-- 保险公司资质文件持久化 + 结算配置持久化：
--   insurance_carrier 新增 documents jsonb 列、settlement_config jsonb 列。
--
-- 背景：
-- 1. 资质文件：保险公司新建/编辑表单第 5 步「资质文件」此前仅保存在浏览器内存，
--    刷新或再次进入编辑页即丢失（编辑页无法回显）。改为与产品合规文件一致的
--    方案：文件先 POST /api/uploads 上传，返回的元数据（key/name/size/url/
--    mimetype）以 jsonb 数组存入本列；编辑时原样回显。
-- 2. 结算配置：表单第 4 步的 billingFormat/billCutoffDay/paymentTermDays/
--    currency/premiumCollection 此前从未提交后端，详情页全部硬编码。改为以
--    jsonb 对象存入 settlement_config 列，详情页与编辑页均从该列读取。
--
-- 可重复执行（IF NOT EXISTS）。
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'insurance_carrier'
                    AND column_name = 'documents') THEN
    ALTER TABLE insurance_carrier
      ADD COLUMN documents jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'insurance_carrier'
                    AND column_name = 'settlement_config') THEN
    ALTER TABLE insurance_carrier
      ADD COLUMN settlement_config jsonb;
  END IF;
END $$;

COMMENT ON COLUMN insurance_carrier.documents IS
  '资质文件元数据数组：[{key,name,size,url,mimetype}]；文件本体在 /uploads，key 为固定槽位（businessLicense/mainAgreement/nda/dpa/amBestReport）。';

COMMENT ON COLUMN insurance_carrier.settlement_config IS
  '结算配置：{billingFormat,billCutoffDay,paymentTermDays,currency,premiumCollection}。';
