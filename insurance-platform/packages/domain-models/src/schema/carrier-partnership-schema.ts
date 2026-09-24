/**
 * Carrier Cooperation Domain Schema — carrier_partnership
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * V1.0.10 (2026-09-11) termination-flow columns:
 *   terminate_reason / terminate_note / terminate_effect_type /
 *   terminate_effective_at / terminated_at / pending_change
 *
 * Logical FKs (enforced in DB, target tables not archived as Drizzle schemas):
 *   carrier_id -> insurance_carrier(carrier_id)
 */

import { pgTable, varchar, text, integer, boolean, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const carrierPartnership = pgTable('carrier_partnership', {
  partnershipId: varchar('partnership_id', { length: 32 }).primaryKey(),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  cooperationType: varchar('cooperation_type', { length: 32 }),
  status: varchar('status', { length: 32 }).default('Draft'),
  commissionTier: varchar('commission_tier', { length: 16 }),
  notes: text('notes'),
  notesEn: text('notes_en'),
  settlementMethod: varchar('settlement_method', { length: 32 }),
  settlementCycleDays: integer('settlement_cycle_days').default(30),
  premiumCollection: varchar('premium_collection', { length: 32 }),
  premiumSettlement: varchar('premium_settlement', { length: 32 }),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  productScope: jsonb('product_scope').$type<{
    lobTypes?: string[];
    [key: string]: unknown;
  }>().default({}),
  stateScope: jsonb('state_scope').$type<string[]>().default([]),
  contractFile: jsonb('contract_file').$type<{
    url?: string;
    originalName?: string;
    [key: string]: unknown;
  }>(),
  createdBy: varchar('created_by', { length: 64 }),

  /** V1.0.10 prototype alignment (2026-09-12, doc ch.10): free-text account owner name. */
  ownerName: varchar('owner_name', { length: 64 }),

  // ─── V1.0.10 termination flow ────────────────────────────────────
  terminateReason: varchar('terminate_reason', { length: 64 }),
  terminateNote: text('terminate_note'),
  /** immediate / end-of-term / scheduled */
  terminateEffectType: varchar('terminate_effect_type', { length: 16 }),
  terminateEffectiveAt: timestamp('terminate_effective_at', { withTimezone: true }),
  terminatedAt: timestamp('terminated_at', { withTimezone: true }),
  pendingChange: jsonb('pending_change').$type<{
    action: string;
    reason?: string;
    note?: string;
    effectType?: 'immediate' | 'end-of-term' | 'scheduled';
    source?: 'immediate' | 'scheduler';
    [key: string]: unknown;
  }>(),

  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxPartnershipCarrier: index('idx_partnership_carrier').on(table.carrierId),
  idxPartnershipStatus: index('idx_partnership_status').on(table.status),
  idxCarrierPartnershipPending: index('idx_carrier_partnership_pending')
    .on(table.terminateEffectiveAt)
    .where(sql`${table.pendingChange} IS NOT NULL`),
}));
