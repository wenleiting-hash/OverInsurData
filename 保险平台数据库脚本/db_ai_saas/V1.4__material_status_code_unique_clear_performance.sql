-- V1.4 — training-material status, product_code uniqueness scope, performance seed cleanup
--
-- Three independent changes required by the product module:
--
-- 1) product_training_material.status
--    The training-materials tab needs a "set active / set inactive" action, but the table had no
--    status column (unlike product_underwriting_rule, which already has one). Materials are never
--    hard-removed from a carrier's history in normal use, so a soft active/inactive flag is enough.
--
-- 2) insurance_product.product_code uniqueness
--    product_code carried a table-wide UNIQUE constraint while deletes are soft (deleted = TRUE).
--    11 of the 12 existing products are soft-deleted yet still occupied their codes, so creating a
--    product with a code that is invisible in the list failed with a raw 23505 → HTTP 500.
--    Scope the constraint to live rows only; a deleted product's code becomes reusable.
--
-- 3) product_performance cleanup
--    Every row was written by the seed script (identical created_at) with a fictitious Apr'26–Aug'26
--    series for products that have no real business yet. Cleared so the performance dashboard shows
--    its empty state instead of numbers that look real. Real rows should be produced by reporting jobs.
--
-- Idempotent: safe to re-run.

-- ── 1) training material status ──────────────────────────────────────────────
ALTER TABLE product_training_material
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

COMMENT ON COLUMN product_training_material.status IS
  'Material availability: active (listed/downloadable) or inactive (withdrawn, kept for history).';

-- ── 2) product_code unique among live rows only ──────────────────────────────
ALTER TABLE insurance_product
  DROP CONSTRAINT IF EXISTS insurance_product_product_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_insurance_product_code_live
  ON insurance_product (product_code)
  WHERE deleted = FALSE;

COMMENT ON INDEX uq_insurance_product_code_live IS
  'product_code must be unique among non-deleted products; soft-deleted rows release their code.';

-- ── 3) drop seeded performance rows ──────────────────────────────────────────
DELETE FROM product_performance;
