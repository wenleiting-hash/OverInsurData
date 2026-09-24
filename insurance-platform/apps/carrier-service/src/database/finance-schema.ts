/**
 * Finance Module — Drizzle Schema Definitions
 *
 * Tables:
 * - commissionBill        (commission_bill)
 * - commissionBillLine    (commission_bill_line)
 * - reconciliationDiff    (reconciliation_diff)
 * - settlementCycleConfig (settlement_cycle_config)
 * - carrierCommissionRate (carrier_commission_rate)
 */

import { pgTable, varchar, integer, boolean, text, jsonb, numeric, timestamp, date } from 'drizzle-orm/pg-core';

// ─── commission_bill ──────────────────────────────────────────────

export const commissionBill = pgTable('commission_bill', {
  billId:           varchar('bill_id', { length: 32 }).primaryKey(),
  /** V1.0.15 展示批次号 IMP-YYYYMMDD-NNN。 */
  batchNo:          varchar('batch_no', { length: 40 }),
  fileName:         varchar('file_name', { length: 256 }).notNull(),
  insurerId:        varchar('insurer_id', { length: 32 }),
  insurerName:      varchar('insurer_name', { length: 128 }),
  insurerShort:     varchar('insurer_short', { length: 64 }),
  period:           varchar('period', { length: 16 }),
  importDate:       timestamp('import_date', { withTimezone: true }).defaultNow(),
  importedBy:       varchar('imported_by', { length: 64 }),
  fileSize:         varchar('file_size', { length: 32 }),
  fileFormat:       varchar('file_format', { length: 8 }),
  /** 旧状态轴（uploaded/exception/reconciled/settled），V1.0.15 保留兼容。 */
  status:           varchar('status', { length: 16 }).default('uploaded'),
  /** V1.0.15 导入状态轴：imported / voided。 */
  importStatus:     varchar('import_status', { length: 16 }).default('imported'),
  /** V1.0.15 对账状态轴：pending / running / completed（completed=已封帐锁定）。 */
  reconStatus:      varchar('recon_status', { length: 16 }).default('pending'),
  successCount:     integer('success_count').default(0),
  failedCount:      integer('failed_count').default(0),
  duplicateCount:   integer('duplicate_count').default(0),
  lockedBy:         varchar('locked_by', { length: 64 }),
  lockedAt:         timestamp('locked_at', { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
  voidedBy:         varchar('voided_by', { length: 64 }),
  voidedAt:         timestamp('voided_at', { withTimezone: true }),
  totalPolicies:    integer('total_policies').default(0),
  totalPremium:     numeric('total_premium', { precision: 14, scale: 2 }).default('0'),
  totalCommission:  numeric('total_commission', { precision: 14, scale: 2 }).default('0'),
  parsedPolicies:   integer('parsed_policies').default(0),
  matchedPolicies:  integer('matched_policies').default(0),
  exceptionCount:   integer('exception_count').default(0),
  reconciledAmount: numeric('reconciled_amount', { precision: 14, scale: 2 }).default('0'),
  differenceAmount: numeric('difference_amount', { precision: 14, scale: 2 }).default('0'),
  settledDate:      date('settled_date'),
  deleted:          boolean('deleted').default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── commission_bill_line ─────────────────────────────────────────

export const commissionBillLine = pgTable('commission_bill_line', {
  lineId:              varchar('line_id', { length: 32 }).primaryKey(),
  billId:              varchar('bill_id', { length: 32 }),
  lineNumber:          integer('line_number'),
  policyNumber:        varchar('policy_number', { length: 64 }),
  insuredName:         varchar('insured_name', { length: 128 }),
  channelId:           varchar('channel_id', { length: 32 }),
  channelName:         varchar('channel_name', { length: 128 }),
  state:               varchar('state', { length: 8 }),
  lineOfBusiness:      varchar('line_of_business', { length: 64 }),
  effectiveDate:       date('effective_date'),
  premium:             numeric('premium', { precision: 14, scale: 2 }).default('0'),
  commissionRate:      numeric('commission_rate', { precision: 6, scale: 4 }).default('0'),
  commissionAmount:    numeric('commission_amount', { precision: 14, scale: 2 }).default('0'),
  ourPolicyNumber:     varchar('our_policy_number', { length: 64 }),
  ourCommissionRate:   numeric('our_commission_rate', { precision: 6, scale: 4 }),
  ourCommissionAmount: numeric('our_commission_amount', { precision: 14, scale: 2 }),
  diffAmount:          numeric('diff_amount', { precision: 14, scale: 2 }),
  matchStatus:         varchar('match_status', { length: 16 }).default('unmatched'),
  /** V1.0.15 行状态：imported / duplicate / failed（去重键 保司+月份+保单号）。 */
  lineStatus:          varchar('line_status', { length: 16 }).default('imported'),
  /** V1.0.15 试算命中档位：product_state/product_all/lob_state/lob_all/bill_original。 */
  trialLevel:          varchar('trial_level', { length: 24 }),
  errorReason:         varchar('error_reason', { length: 512 }),
  skipReason:          varchar('skip_reason', { length: 512 }),
  diffNote:            text('diff_note'),
  diffNoteEn:          text('diff_note_en'),
  deleted:             boolean('deleted').default(false),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── reconciliation_diff ──────────────────────────────────────────

export const reconciliationDiff = pgTable('reconciliation_diff', {
  diffId:       varchar('diff_id', { length: 32 }).primaryKey(),
  billId:       varchar('bill_id', { length: 32 }),
  billName:     varchar('bill_name', { length: 256 }),
  insurerId:    varchar('insurer_id', { length: 32 }),
  insurerShort: varchar('insurer_short', { length: 64 }),
  policyNumber: varchar('policy_number', { length: 64 }),
  insuredName:  varchar('insured_name', { length: 128 }),
  diffType:     varchar('diff_type', { length: 32 }),
  billAmount:   numeric('bill_amount', { precision: 14, scale: 2 }).default('0'),
  ourAmount:    numeric('our_amount', { precision: 14, scale: 2 }).default('0'),
  diffAmount:   numeric('diff_amount', { precision: 14, scale: 2 }).default('0'),
  status:       varchar('status', { length: 16 }).default('open'),
  note:         text('note'),
  noteEn:       text('note_en'),
  assignedTo:   varchar('assigned_to', { length: 64 }),
  createdDate:  date('created_date'),
  resolvedDate: date('resolved_date'),
  deleted:      boolean('deleted').default(false),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── settlement_cycle_config ──────────────────────────────────────

export const settlementCycleConfig = pgTable('settlement_cycle_config', {
  configId:        varchar('config_id', { length: 32 }).primaryKey(),
  insurerId:       varchar('insurer_id', { length: 32 }),
  insurerName:     varchar('insurer_name', { length: 128 }),
  insurerShort:    varchar('insurer_short', { length: 64 }),
  frequency:       varchar('frequency', { length: 16 }).default('monthly'),
  cutoffDay:       integer('cutoff_day').default(25),
  paymentDueDays:  integer('payment_due_days').default(30),
  method:          varchar('method', { length: 16 }).default('ach'),
  currency:        varchar('currency', { length: 8 }).default('USD'),
  minSettleAmount: numeric('min_settle_amount', { precision: 14, scale: 2 }).default('0'),
  autoReconcile:   boolean('auto_reconcile').default(false),
  autoSettle:      boolean('auto_settle').default(false),
  notifyDaysBefore: integer('notify_days_before').default(7),
  bankAccount:     varchar('bank_account', { length: 64 }),
  routingNumber:   varchar('routing_number', { length: 32 }),
  contactEmail:    varchar('contact_email', { length: 128 }),
  lastSettledDate: date('last_settled_date'),
  nextDueDate:     date('next_due_date'),
  nextDueAmount:   numeric('next_due_amount', { precision: 14, scale: 2 }),
  ytdSettled:      numeric('ytd_settled', { precision: 14, scale: 2 }).default('0'),
  deleted:         boolean('deleted').default(false),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── carrier_commission_rate ───────────────────────────────────────

export const carrierCommissionRate = pgTable('carrier_commission_rate', {
  rateId:          varchar('rate_id', { length: 32 }).primaryKey(),
  carrierId:       varchar('carrier_id', { length: 32 }).notNull(),
  dimension:       varchar('dimension', { length: 16 }).notNull(),
  lineOfBusiness:  varchar('line_of_business', { length: 64 }),
  productId:       varchar('product_id', { length: 32 }),
  state:           varchar('state', { length: 8 }),
  rate:            numeric('rate', { precision: 5, scale: 4 }).notNull(),
  effectiveFrom:   date('effective_from').notNull(),
  effectiveTo:     date('effective_to'),
  status:          varchar('status', { length: 16 }).default('pending').notNull(),
  version:         integer('version').default(1).notNull(),
  createdBy:       varchar('created_by', { length: 64 }),
  remark:          varchar('remark', { length: 512 }),
  deleted:         boolean('deleted').default(false).notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type inference exports ──────────────────────────────────────

export type CommissionBill = typeof commissionBill.$inferSelect;
export type NewCommissionBill = typeof commissionBill.$inferInsert;
export type CommissionBillLine = typeof commissionBillLine.$inferSelect;
export type NewCommissionBillLine = typeof commissionBillLine.$inferInsert;
export type ReconciliationDiff = typeof reconciliationDiff.$inferSelect;
export type NewReconciliationDiff = typeof reconciliationDiff.$inferInsert;
export type SettlementCycleConfig = typeof settlementCycleConfig.$inferSelect;
export type NewSettlementCycleConfig = typeof settlementCycleConfig.$inferInsert;
export type CarrierCommissionRate = typeof carrierCommissionRate.$inferSelect;
export type NewCarrierCommissionRate = typeof carrierCommissionRate.$inferInsert;
