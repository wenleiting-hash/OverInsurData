/**
 * Carrier Cooperation Domain Schema — carrier_renewal_task (V1.0.10)
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * Deterministic sync IDs: rn_c_<contract_id> / rn_p_<partnership_id>;
 * manual tasks use timestamp-based IDs and are never overwritten by sync.
 *
 * Logical FKs (enforced in DB):
 *   partnership_id -> carrier_partnership(partnership_id)
 *   carrier_id     -> insurance_carrier(carrier_id)
 *   contract_id    -> carrier_contract(contract_id)
 */

import { pgTable, varchar, boolean, timestamp, date, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const carrierRenewalTask = pgTable('carrier_renewal_task', {
  renewalId: varchar('renewal_id', { length: 32 }).primaryKey(),
  partnershipId: varchar('partnership_id', { length: 32 }).notNull(),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  contractId: varchar('contract_id', { length: 32 }),
  title: varchar('title', { length: 256 }).notNull(),
  expiryDate: date('expiry_date').notNull(),
  /** critical / high / normal / low */
  priority: varchar('priority', { length: 16 }).default('normal'),
  /** upcoming / in-negotiation / renewed / expired */
  status: varchar('status', { length: 24 }).default('upcoming'),
  autoRenew: boolean('auto_renew').default(false),
  accountManager: varchar('account_manager', { length: 128 }),
  lastAction: varchar('last_action', { length: 256 }),
  lastActionAt: date('last_action_at'),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxRenewalExpiry: index('idx_renewal_expiry')
    .on(table.expiryDate)
    .where(sql`${table.deleted} = FALSE`),
}));
