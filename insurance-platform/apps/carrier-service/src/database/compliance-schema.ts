/**
 * Compliance Module — Drizzle Schema Definitions
 *
 * Tables:
 * - complianceRule           (compliance_rule)
 * - ofacScreeningRecord      (ofac_screening_record)
 * - complianceInterception   (compliance_interception)
 * - niprLicense              (nipr_license)
 * - licenseExpiryReminder    (license_expiry_reminder)
 * - complianceAuditReport    (compliance_audit_report)
 */

import { pgTable, varchar, integer, boolean, text, jsonb, numeric, timestamp, char, date } from 'drizzle-orm/pg-core';

// ─── compliance_rule ──────────────────────────────────────────────

export const complianceRule = pgTable('compliance_rule', {
  ruleId:          varchar('rule_id', { length: 32 }).primaryKey(),
  ruleName:        varchar('rule_name', { length: 128 }).notNull(),
  ruleNameEn:      varchar('rule_name_en', { length: 128 }),
  category:        varchar('category', { length: 32 }).notNull().default('appointment'),
  conditionExpr:   text('condition_expr'),
  conditionExprEn: text('condition_expr_en'),
  action:          varchar('action', { length: 32 }).notNull().default('warn'),
  priority:        integer('priority').default(50),
  enabled:         boolean('enabled').default(true),
  triggeredCount:  integer('triggered_count').default(0),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  deleted:         boolean('deleted').default(false),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── ofac_screening_record ────────────────────────────────────────

export const ofacScreeningRecord = pgTable('ofac_screening_record', {
  screeningId:       varchar('screening_id', { length: 32 }).primaryKey(),
  timestamp:         timestamp('timestamp', { withTimezone: true }).defaultNow(),
  entityName:        varchar('entity_name', { length: 256 }).notNull(),
  entityType:        varchar('entity_type', { length: 32 }),
  country:           varchar('country', { length: 64 }),
  dateOfBirth:       varchar('date_of_birth', { length: 16 }),
  identificationNumber: varchar('identification_number', { length: 64 }),
  address:           text('address'),
  screenedBy:        varchar('screened_by', { length: 64 }),
  result:            varchar('result', { length: 32 }).default('pending'),
  matchScore:        numeric('match_score', { precision: 5, scale: 2 }),
  matchScoreLevel:   varchar('match_score_level', { length: 16 }),
  matchedEntry:      varchar('matched_entry', { length: 256 }),
  matchedList:       varchar('matched_list', { length: 128 }),
  program:           jsonb('program').default([]).$type<string[]>(),
  policyId:          varchar('policy_id', { length: 32 }),
  reviewedBy:        varchar('reviewed_by', { length: 64 }),
  reviewNote:        text('review_note'),
  overrideApproved:  boolean('override_approved').default(false),
  reviewDate:        timestamp('review_date', { withTimezone: true }),
  detailsJson:       jsonb('details_json').default({}).$type<Record<string, any>>(),
  deleted:           boolean('deleted').default(false),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── compliance_interception ──────────────────────────────────────

export const complianceInterception = pgTable('compliance_interception', {
  interceptionId:    varchar('interception_id', { length: 32 }).primaryKey(),
  timestamp:         timestamp('timestamp', { withTimezone: true }).defaultNow(),
  channelId:         varchar('channel_id', { length: 32 }),
  channelName:       varchar('channel_name', { length: 128 }),
  insurerId:         varchar('insurer_id', { length: 32 }),
  insurerShort:      varchar('insurer_short', { length: 64 }),
  state:             varchar('state', { length: 8 }),
  line:              varchar('line', { length: 64 }),
  policyDraftId:     varchar('policy_draft_id', { length: 32 }),
  customerName:      varchar('customer_name', { length: 128 }),
  premiumAmount:     numeric('premium_amount', { precision: 14, scale: 2 }).default('0'),
  result:            varchar('result', { length: 32 }).default('blocked'),
  reasons:           jsonb('reasons').default([]).$type<string[]>(),
  reasonDescriptions: jsonb('reason_descriptions').default([]).$type<string[]>(),
  severity:          varchar('severity', { length: 16 }),
  actionType:        varchar('action_type', { length: 64 }),
  matchedEntity:     varchar('matched_entity', { length: 256 }),
  listSource:        varchar('list_source', { length: 128 }),
  matchScore:        numeric('match_score', { precision: 5, scale: 2 }),
  ruleId:            varchar('rule_id', { length: 32 }),
  detailsJson:       jsonb('details_json').default({}).$type<Record<string, any>>(),
  resolvedStatus:    varchar('resolved_status', { length: 32 }),
  resolvedAt:        timestamp('resolved_at', { withTimezone: true }),
  reviewedBy:        varchar('reviewed_by', { length: 64 }),
  reviewedAt:        timestamp('reviewed_at', { withTimezone: true }),
  overrideApproved:  boolean('override_approved').default(false),
  overrideNote:      text('override_note'),
  releaseNote:       text('release_note'),
  deleted:           boolean('deleted').default(false),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── nipr_license ─────────────────────────────────────────────────

export const niprLicense = pgTable('nipr_license', {
  licenseId:          varchar('license_id', { length: 32 }).primaryKey(),
  channelId:          varchar('channel_id', { length: 32 }),
  channelName:        varchar('channel_name', { length: 128 }),
  npnNumber:          varchar('npn_number', { length: 32 }),
  licenseNumber:      varchar('license_number', { length: 64 }),
  state:              varchar('state', { length: 8 }),
  licenseType:        varchar('license_type', { length: 32 }),
  lines:              jsonb('lines').default([]).$type<string[]>(),
  status:             varchar('status', { length: 16 }).default('pending'),
  issueDate:          date('issue_date'),
  expiryDate:         date('expiry_date'),
  lastVerifiedAt:     timestamp('last_verified_at', { withTimezone: true }),
  verificationStatus: varchar('verification_status', { length: 16 }).default('pending'),
  residencyState:     varchar('residency_state', { length: 8 }),
  ceCompleted:        boolean('ce_completed').default(false),
  ceHoursRequired:    numeric('ce_hours_required', { precision: 4, scale: 1 }),
  ceHoursCompleted:   numeric('ce_hours_completed', { precision: 4, scale: 1 }),
  niprTransactionId:  varchar('nipr_transaction_id', { length: 64 }),
  deleted:            boolean('deleted').default(false),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── license_expiry_reminder ──────────────────────────────────────

export const licenseExpiryReminder = pgTable('license_expiry_reminder', {
  reminderId:     varchar('reminder_id', { length: 32 }).primaryKey(),
  licenseId:      varchar('license_id', { length: 32 }),
  channelId:      varchar('channel_id', { length: 32 }),
  channelName:    varchar('channel_name', { length: 128 }),
  daysBefore:     integer('days_before').default(30),
  notifyAt:       timestamp('notify_at', { withTimezone: true }),
  status:         varchar('status', { length: 16 }).default('pending'),
  sentAt:         timestamp('sent_at', { withTimezone: true }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  deleted:        boolean('deleted').default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── compliance_audit_report ──────────────────────────────────────

export const complianceAuditReport = pgTable('compliance_audit_report', {
  reportId:     varchar('report_id', { length: 32 }).primaryKey(),
  reportName:   varchar('report_name', { length: 256 }).notNull(),
  category:     varchar('category', { length: 32 }),
  period:       varchar('period', { length: 16 }),
  generatedAt:  timestamp('generated_at', { withTimezone: true }),
  generatedBy:  varchar('generated_by', { length: 64 }),
  status:       varchar('status', { length: 16 }).default('generating'),
  fileSize:     varchar('file_size', { length: 32 }),
  recordCount:  integer('record_count').default(0),
  format:       varchar('format', { length: 8 }).default('PDF'),
  recipients:   jsonb('recipients').default([]).$type<string[]>(),
  deleted:      boolean('deleted').default(false),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type inference exports ──────────────────────────────────────

export type ComplianceRule = typeof complianceRule.$inferSelect;
export type NewComplianceRule = typeof complianceRule.$inferInsert;
export type OfacScreeningRecord = typeof ofacScreeningRecord.$inferSelect;
export type NewOfacScreeningRecord = typeof ofacScreeningRecord.$inferInsert;
export type ComplianceInterception = typeof complianceInterception.$inferSelect;
export type NewComplianceInterception = typeof complianceInterception.$inferInsert;
export type NiprLicense = typeof niprLicense.$inferSelect;
export type NewNiprLicense = typeof niprLicense.$inferInsert;
export type LicenseExpiryReminder = typeof licenseExpiryReminder.$inferSelect;
export type NewLicenseExpiryReminder = typeof licenseExpiryReminder.$inferInsert;
export type ComplianceAuditReport = typeof complianceAuditReport.$inferSelect;
export type NewComplianceAuditReport = typeof complianceAuditReport.$inferInsert;
