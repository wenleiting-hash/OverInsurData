/**
 * i18n_db Schema Definitions
 * 
 * Database: Multi-language Management Domain
 * Tables: auth_i18n_translation, auth_i18n_version, auth_i18n_review_queue, dict_term
 */

import { pgTable, varchar, timestamp, index, jsonb, integer, text } from 'drizzle-orm/pg-core';

// ─── auth_i18n_translation (翻译词条主表) ─────────────────────────────────────

export const authI18nTranslation = pgTable('auth_i18n_translation', {
  translationId: varchar('translation_id', { length: 32 }).primaryKey(),
  namespace: varchar('namespace', { length: 64 }).notNull(),
  key: varchar('key', { length: 256 }).notNull(),
  enUS: varchar('en_us', { length: 512 }).notNull(),
  zhCN: varchar('zh_cn', { length: 512 }),
  type: varchar('type', {
    enum: ['label', 'button', 'placeholder', 'toast', 'confirm', 'validate', 'error-page'],
  }),
  module: varchar('module', { length: 32 }),
  section: varchar('section', { length: 64 }),
  status: varchar('status', { length: 1 }).default('1'), // 1=published, 0=draft
  modified: integer('modified').default(0),
  reviewedBy: varchar('reviewed_by', { length: 32 }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<{
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueKey: index('uk_namespace_key').on(table.namespace, table.key),
  idxNamespace: index('idx_namespace').on(table.namespace),
  idxStatus: index('idx_status').on(table.status),
}));

// ─── auth_i18n_version (版本控制表) ───────────────────────────────────────────

export const authI18nVersion = pgTable('auth_i18n_version', {
  versionId: varchar('version_id', { length: 32 }).primaryKey(),
  versionNumber: varchar('version_number', { length: 16 }).notNull(),
  namespace: varchar('namespace', { length: 64 }), // 'all' for full release
  changeLog: text('change_log'),
  translatedCount: integer('translated_count').default(0),
  updatedCount: integer('updated_count').default(0),
  publishedBy: varchar('published_by', { length: 32 }),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  rollbackTo: varchar('rollback_to', { length: 32 }),
  rollbackReason: text('rollback_reason'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueNumber: index('uk_version_number').on(table.versionNumber),
  idxIsActive: index('idx_is_active').on(table.isActive),
}));

// ─── auth_i18n_review_queue (审核队列) ────────────────────────────────────────

export const authI18nReviewQueue = pgTable('auth_i18n_review_queue', {
  queueId: varchar('queue_id', { length: 32 }).primaryKey(),
  translationId: varchar('translation_id', { length: 32 })
    .notNull()
    .references(() => authI18nTranslation.translationId),
  submittedBy: varchar('submitted_by', { length: 32 }).notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  priority: varchar('priority', {
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  }).default('MEDIUM'),
  assignedTo: varchar('assigned_to', { length: 32 }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewDecision: varchar('review_decision', {
    enum: ['APPROVED', 'REJECTED', 'NEEDS_UPDATE'],
  }),
  reviewerComment: text('reviewer_comment'),
  status: varchar('status', {
    enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'],
  }).default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxPriority: index('idx_priority').on(table.priority),
  idxStatus: index('idx_status').on(table.status),
}));

// ─── dict_term (保险术语库) ────────────────────────────────────────────────────

export const dictTerm = pgTable('dict_term', {
  termId: varchar('term_id', { length: 32 }).primaryKey(),
  term: varchar('term', { length: 128 }).notNull(),
  definition: text('definition').notNull(),
  category: varchar('category', {
    enum: ['LICENSE', 'COMPLIANCE', 'FINANCE', 'PRODUCT', 'CHANNEL', 'COMMISSION'],
  }),
  usageExample: varchar('usage_example', { length: 256 }),
  enEquivalent: varchar('en_equivalent', { length: 128 }),
  zhEquivalent: varchar('zh_equivalent', { length: 128 }).notNull(),
  frequencyOfUse: integer('frequency_of_use').default(0),
  verifiedBy: varchar('verified_by', { length: 32 }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  status: varchar('status', { length: 1 }).default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueTerm: index('uk_term_en_zh').on(table.term, table.zhEquivalent),
}));
