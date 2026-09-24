/**
 * Carrier Cooperation Domain Schema — carrier_contact
 *
 * Database: overinsur_db
 * Type/single-source-of-truth archive only; runtime data access still uses pool.query.
 *
 * Logical FKs (enforced in DB):
 *   carrier_id     -> insurance_carrier(carrier_id)
 *   partnership_id -> carrier_partnership(partnership_id)
 */

import { pgTable, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const carrierContact = pgTable('carrier_contact', {
  contactId: varchar('contact_id', { length: 32 }).primaryKey(),
  carrierId: varchar('carrier_id', { length: 32 }).notNull(),
  partnershipId: varchar('partnership_id', { length: 32 }),
  firstName: varchar('first_name', { length: 64 }),
  lastName: varchar('last_name', { length: 64 }),
  fullName: varchar('full_name', { length: 128 }).notNull(),
  position: varchar('position', { length: 100 }),
  department: varchar('department', { length: 100 }),
  /** executive / underwriting / claims / finance / it / legal / marketing */
  role: varchar('role', { length: 32 }),
  email: varchar('email', { length: 128 }),
  phone: varchar('phone', { length: 32 }),
  mobilePhone: varchar('mobile_phone', { length: 32 }),
  officeAddress: varchar('office_address', { length: 256 }),
  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),
  createdBy: varchar('created_by', { length: 64 }),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxContactCarrier: index('idx_contact_carrier').on(table.carrierId),
  idxContactPartnership: index('idx_contact_partnership').on(table.partnershipId),
}));
