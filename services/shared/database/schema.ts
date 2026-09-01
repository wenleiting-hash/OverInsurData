import { pgTable, varchar, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createPostgresJsClient } from 'drizzle-ox';

export const insuranceCarrier = pgTable('insurance_carrier', {
  carrierId: varchar('carrier_id', { length: 32 }).primaryKey(),
  carrierName: varchar('carrier_name', { length: 128 }).notNull(),
  naicCode: varchar('naic_code', { length: 8 }).unique().notNull(),
  type: varchar('type', { length: 50 }), // Admitted, Non-Admitted
  rating: varchar('rating', { length: 10 }),
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 导出类型推断
export type InsuranceCarrier = typeof insuranceCarrier.$inferSelect;
export type NewInsuranceCarrier = typeof insuranceCarrier.$inferInsert;
