/**
 * Carrier Cooperation Domain Schema — carrier_product_access_request (V1.0.10)
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * State machine: available → requested → in-review → approved → integrated;
 *                rejected / suspended are terminal/side states.
 * product_id is nullable (manual requests may reference no synced product);
 * product_name is denormalized to survive broken product links.
 *
 * Logical FKs (enforced in DB):
 *   partnership_id -> carrier_partnership(partnership_id)
 *   carrier_id     -> insurance_carrier(carrier_id)
 *   product_id     -> insurance_product(product_id)
 */

import { pgTable, varchar, text, boolean, timestamp, jsonb, numeric, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const carrierProductAccessRequest = pgTable('carrier_product_access_request', {
  requestId: varchar('request_id', { length: 32 }).primaryKey(),
  partnershipId: varchar('partnership_id', { length: 32 }),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  productId: varchar('product_id', { length: 32 }),
  productName: varchar('product_name', { length: 128 }).notNull(),
  productCode: varchar('product_code', { length: 32 }),
  lineOfBusiness: varchar('line_of_business', { length: 32 }),
  targetStates: jsonb('target_states').$type<string[]>().default(['ALL']),
  /** critical / high / normal / low */
  priority: varchar('priority', { length: 16 }).default('normal'),
  /** available / requested / in-review / approved / integrated / rejected / suspended */
  status: varchar('status', { length: 16 }).default('available'),
  estimatedPremium: numeric('estimated_premium', { precision: 14, scale: 2 }),
  technicalReqs: jsonb('technical_reqs').$type<string[]>().default([]),
  apiDoc: boolean('api_doc').default(false),
  testCompleted: boolean('test_completed').default(false),
  notes: text('notes'),
  requestedBy: varchar('requested_by', { length: 64 }),
  reviewedBy: varchar('reviewed_by', { length: 64 }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxAccessStatus: index('idx_access_status')
    .on(table.status)
    .where(sql`${table.deleted} = FALSE`),
}));
