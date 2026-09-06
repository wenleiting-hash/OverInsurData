/**
 * OverInsur (ovwr) i18n_db Schema Definitions
 * 
 * IMPORTANT: All tables use 'ovwr_' prefix to distinguish from existing projects
 * Database: i18n_db within ai-saas-postgres container (port 5432)
 */

import { pgTable, varchar, timestamp, index, jsonb, integer, text } from 'drizzle-orm/pg-core';

// ─── ovwr_auth_i18n_translation (翻译词条主表) ──────────────────────────────

export const ovwrAuthI18nTranslation = pgTable('ovwr_auth_i18n_translation', {
  ovwrTranslationId: varchar('ovwr_translation_id', { length: 32 }).primaryKey(),
  ovwrNamespace: varchar('ovwr_namespace', { length: 64 }).notNull(),
  ovwrKey: varchar('ovwr_key', { length: 256 }).notNull(),
  ovwrEnUS: varchar('ovwr_en_us', { length: 512 }).notNull(),
  ovwrZhCN: varchar('ovwr_zh_cn', { length: 512 }),
  ovwrType: varchar('ovwr_type', {
    enum: ['label', 'button', 'placeholder', 'toast', 'confirm', 'validate', 'error-page'],
  }),
  ovwrModule: varchar('ovwr_module', { length: 32 }),
  ovwrSection: varchar('ovwr_section', { length: 64 }),
  ovwrStatus: varchar('ovwr_status', { length: 1 }).default('1'), // 1=published, 0=draft
  ovwrModified: integer('ovwr_modified').default(0),
  ovwrReviewedBy: varchar('ovwr_reviewed_by', { length: 32 }),
  ovwrReviewedAt: timestamp('ovwr_reviewed_at', { withTimezone: true }),
  ovwrMetadata: jsonb('ovwr_metadata').$type<{
    originalSource?: string;
    lastEditor?: string;
    editHistory?: Array<{
      editedBy: string;
      editedAt: string;
      beforeEn: string;
      afterEn: string;
      beforeZh: string;
      afterZh: string;
    }>;
  }>(),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueKey: index('ovwr_idx_namespace_key').on(table.ovwrNamespace, table.ovwrKey),
  ovwrIdxNamespace: index('ovwr_idx_namespace').on(table.ovwrNamespace),
  ovwrIdxStatus: index('ovwr_idx_status').on(table.ovwrStatus),
}));

// ─── ovwr_auth_i18n_version (版本控制表) ────────────────────────────────────

export const ovwrAuthI18nVersion = pgTable('ovwr_auth_i18n_version', {
  ovwrVersionId: varchar('ovwr_version_id', { length: 32 }).primaryKey(),
  ovwrVersionNumber: varchar('ovwr_version_number', { length: 16 }).notNull(),
  ovwrNamespace: varchar('ovwr_namespace', { length: 64 }), // 'all' for full release
  ovwrChangeLog: text('ovwr_change_log'),
  ovwrTranslatedCount: integer('ovwr_translated_count').default(0),
  ovwrUpdatedCount: integer('ovwr_updated_count').default(0),
  ovwrPublishedBy: varchar('ovwr_published_by', { length: 32 }),
  ovwrPublishedAt: timestamp('ovwr_published_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrRollbackTo: varchar('ovwr_rollback_to', { length: 32 }),
  ovwrRollbackReason: text('ovwr_rollback_reason'),
  ovwrIsActive: integer('ovwr_is_active').default(1),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueNumber: index('ovwr_idx_version_number').on(table.ovwrVersionNumber),
  ovwrIdxIsActive: index('ovwr_idx_is_active').on(table.ovwrIsActive),
}));

// ─── ovwr_auth_i18n_review_queue (审核队列) ─────────────────────────────────

export const ovwrAuthI18nReviewQueue = pgTable('ovwr_auth_i18n_review_queue', {
  ovwrQueueId: varchar('ovwr_queue_id', { length: 32 }).primaryKey(),
  ovwrTranslationId: varchar('ovwr_translation_id', { length: 32 })
    .notNull()
    .references(() => ovwrAuthI18nTranslation.ovwrTranslationId),
  ovwrSubmittedBy: varchar('ovwr_submitted_by', { length: 32 }).notNull(),
  ovwrSubmittedAt: timestamp('ovwr_submitted_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrPriority: varchar('ovwr_priority', {
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  }).default('MEDIUM'),
  ovwrAssignedTo: varchar('ovwr_assigned_to', { length: 32 }),
  ovwrReviewedAt: timestamp('ovwr_reviewed_at', { withTimezone: true }),
  ovwrReviewDecision: varchar('ovwr_review_decision', {
    enum: ['APPROVED', 'REJECTED', 'NEEDS_UPDATE'],
  }),
  ovwrReviewerComment: text('ovwr_reviewer_comment'),
  ovwrStatus: varchar('ovwr_status', {
    enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'],
  }).default('PENDING'),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrIdxPriority: index('ovwr_idx_priority').on(table.ovwrPriority),
  ovwrIdxStatus: index('ovwr_idx_status').on(table.ovwrStatus),
}));

// ─── ovwr_dict_term (保险术语库) ────────────────────────────────────────────

export const ovwrDictTerm = pgTable('ovwr_dict_term', {
  ovwrTermId: varchar('ovwr_term_id', { length: 32 }).primaryKey(),
  ovwrTerm: varchar('ovwr_term', { length: 128 }).notNull(),
  ovwrDefinition: text('ovwr_definition').notNull(),
  ovwrCategory: varchar('ovwr_category', {
    enum: ['LICENSE', 'COMPLIANCE', 'FINANCE', 'PRODUCT', 'CHANNEL', 'COMMISSION'],
  }),
  ovwrUsageExample: varchar('ovwr_usage_example', { length: 256 }),
  ovwrEnEquivalent: varchar('ovwr_en_equivalent', { length: 128 }),
  ovwrZhEquivalent: varchar('ovwr_zh_equivalent', { length: 128 }).notNull(),
  ovwrFrequencyOfUse: integer('ovwr_frequency_of_use').default(0),
  ovwrVerifiedBy: varchar('ovwr_verified_by', { length: 32 }),
  ovwrVerifiedAt: timestamp('ovwr_verified_at', { withTimezone: true }),
  ovwrStatus: varchar('ovwr_status', { length: 1 }).default('1'),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueTerm: index('ovwr_idx_term_en_zh').on(table.ovwrTerm, table.ovwrZhEquivalent),
}));
