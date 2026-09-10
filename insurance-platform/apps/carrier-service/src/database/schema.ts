import { pgTable, varchar, jsonb, timestamp, char } from 'drizzle-orm/pg-core';

// ==================== Insurance Carrier Schema ====================
export const insuranceCarrier = pgTable('insurance_carrier', {
  carrierId: varchar('carrier_id', { length: 32 }).primaryKey(),
  carrierName: varchar('carrier_name', { length: 128 }).notNull(),
  carrierNameShort: varchar('carrier_name_short', { length: 64 }),
  // NOTE: naic_code uniqueness is enforced at DB level by a PARTIAL unique index
  // (insurance_carrier_naic_code_active_key ... WHERE deleted = FALSE), so soft-deleted
  // records do not block reusing a NAIC code. See migration V2.0.3. Do NOT use .unique() here.
  naicCode: varchar('naic_code', { length: 8 }).notNull(),
  
  // Type and Region
  carrierType: varchar('carrier_type', { length: 50 }), // Admitted, Non-Admitted
  hqState: char('hq_state', { length: 2 }),
  regionCode: varchar('region_code', { length: 8 }),
  financialRating: varchar('financial_rating', { length: 8 }),
  
  // Settlement
  settlementCycle: varchar('settlement_cycle', { length: 16 }).default('MONTHLY'),
  statementFormat: varchar('statement_format', { length: 16 }).default('CSV'),
  
  // Status
  status: varchar('status', { length: 20 }).default('Active'),
  contactInfo: jsonb('contact_info').$type<{
    address?: string;
    phone?: string;
    email?: string;
  }>(),
  settlementConfig: jsonb('settlement_config').$type<{
    currency?: string;
    paymentTermDays?: number;
  }>(),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference exports
export type InsuranceCarrier = typeof insuranceCarrier.$inferSelect;
export type NewInsuranceCarrier = typeof insuranceCarrier.$inferInsert;
