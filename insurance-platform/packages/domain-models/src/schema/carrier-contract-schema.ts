/**
 * Carrier Cooperation Domain Schema — carrier_contract
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * Logical FKs (enforced in DB):
 *   partnership_id -> carrier_partnership(partnership_id)
 *   carrier_id     -> insurance_carrier(carrier_id)
 */

import { pgTable, varchar, boolean, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core';

export const carrierContract = pgTable('carrier_contract', {
  contractId: varchar('contract_id', { length: 32 }).primaryKey(),
  partnershipId: varchar('partnership_id', { length: 32 }),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  titleEn: varchar('title_en', { length: 256 }),
  contractType: varchar('contract_type', { length: 32 }),
  version: varchar('version', { length: 16 }),
  effectiveDate: date('effective_date'),
  expiryDate: date('expiry_date'),
  signatoryUs: varchar('signatory_us', { length: 128 }),
  signatoryThem: varchar('signatory_them', { length: 128 }),
  /** draft / negotiating / pending-sign / active / expiring / expired / terminated */
  status: varchar('status', { length: 32 }).default('draft'),
  autoRenew: boolean('auto_renew').default(false),
  tags: jsonb('tags').$type<string[]>().default([]),
  tagsEn: jsonb('tags_en').$type<string[]>().default([]),
  fileUrl: varchar('file_url', { length: 512 }),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxContractPartnership: index('idx_contract_partnership').on(table.partnershipId),
  idxContractCarrier: index('idx_contract_carrier').on(table.carrierId),
}));
