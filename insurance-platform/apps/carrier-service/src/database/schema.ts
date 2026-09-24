import { pgTable, varchar, jsonb, timestamp, char, boolean, integer, bigint, numeric, date } from 'drizzle-orm/pg-core';

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
  state: char('state', { length: 2 }),
  region: varchar('region', { length: 8 }),
  amBestRating: varchar('am_best_rating', { length: 8 }),

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
    billingFormat?: string;
    billCutoffDay?: number;
    premiumCollection?: string;
  }>(),

  // 资质文件元数据（V1.0.17）：[{ key, name, size, url, mimetype }]，文件本体在 /uploads
  documents: jsonb('documents').$type<Array<{
    key: string;
    name: string;
    size?: number;
    url: string;
    mimetype?: string;
  }>>(),

  // Cooperation & ratings
  coopType: varchar('coop_type', { length: 32 }),
  coopStatus: varchar('coop_status', { length: 16 }).default('active'),
  foundedYear: integer('founded_year'),
  website: varchar('website', { length: 256 }),
  spRating: varchar('sp_rating', { length: 8 }),
  moodysRating: varchar('moodys_rating', { length: 8 }),
  fitchRating: varchar('fitch_rating', { length: 8 }),
  contractExpiry: date('contract_expiry'),
  lines: jsonb('lines').$type<string[]>().default([]),

  // Business metrics
  revenue: bigint('revenue', { mode: 'number' }).default(0),
  lossRatio: numeric('loss_ratio').default('0'),
  renewalRate: numeric('renewal_rate').default('0'),
  policyCount: integer('policy_count').default(0),
  commissionIncome: bigint('commission_income', { mode: 'number' }).default(0),
  channelCount: integer('channel_count').default(0),
  productCount: integer('product_count').default(0),

  // Soft delete
  deleted: boolean('deleted').notNull().default(false),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference exports
export type InsuranceCarrier = typeof insuranceCarrier.$inferSelect;
export type NewInsuranceCarrier = typeof insuranceCarrier.$inferInsert;
