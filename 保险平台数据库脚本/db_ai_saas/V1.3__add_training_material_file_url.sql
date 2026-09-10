-- V1.3 — add file_url to product_training_material
--
-- Why: training materials were seeded with a display-only file_name label and no stored bytes, so
-- the download button in ProductDetail had nothing to fetch. Real uploads now go through
-- POST /api/uploads (multer diskStorage), which returns a public path like /uploads/1699999999-123.pdf.
-- That path is persisted here so the material can be previewed/downloaded.
--
-- Product compliance documents need no new column: they live in insurance_product.documents (jsonb),
-- whose entries already carry { key, name, size, url, mimetype }.
--
-- Idempotent: safe to re-run.

ALTER TABLE product_training_material
  ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);

COMMENT ON COLUMN product_training_material.file_url IS
  'Public download path returned by POST /api/uploads (e.g. /uploads/<storedName>); NULL for legacy seed rows.';
