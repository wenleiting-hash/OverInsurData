/**
 * Carrier Cooperation Domain Schema — carrier_settlement_config
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * Logical FKs (enforced in DB):
 *   carrier_id     -> insurance_carrier(carrier_id)
 *   partnership_id -> carrier_partnership(partnership_id)
 */

import { pgTable, varchar, integer, boolean, timestamp, date, index } from 'drizzle-orm/pg-core';

export const carrierSettlementConfig = pgTable('carrier_settlement_config', {
  configId: varchar('config_id', { length: 32 }).primaryKey(),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  partnershipId: varchar('partnership_id', { length: 32 }),
  /** Monthly / Quarterly / SemiAnnual */
  cycle: varchar('cycle', { length: 16 }).default('Monthly'),
  billCutoffDay: integer('bill_cutoff_day').default(25),
  paymentTermDays: integer('payment_term_days').default(30),
  /** ACH / Wire / Check */
  paymentMethod: varchar('payment_method', { length: 16 }).default('ACH'),
  /** EDI / API / Manual */
  billingFormat: varchar('billing_format', { length: 16 }).default('EDI'),
  apiEnabled: boolean('api_enabled').default(false),
  /** AgencyBill / DirectBill */
  premiumCollection: varchar('premium_collection', { length: 16 }).default('AgencyBill'),
  updatedBy: varchar('updated_by', { length: 64 }),
  lastUpdated: date('last_updated'),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxSettlementCarrier: index('idx_settlement_carrier').on(table.carrierId),
  idxSettlementPartnership: index('idx_settlement_partnership').on(table.partnershipId),
}));
