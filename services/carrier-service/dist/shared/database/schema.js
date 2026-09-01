"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insuranceCarrier = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.insuranceCarrier = (0, pg_core_1.pgTable)('insurance_carrier', {
    carrierId: (0, pg_core_1.varchar)('carrier_id', { length: 32 }).primaryKey(),
    carrierName: (0, pg_core_1.varchar)('carrier_name', { length: 128 }).notNull(),
    naicCode: (0, pg_core_1.varchar)('naic_code', { length: 8 }).unique().notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }),
    rating: (0, pg_core_1.varchar)('rating', { length: 10 }),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('Active'),
    contactInfo: (0, pg_core_1.jsonb)('contact_info').$type(),
    settlementConfig: (0, pg_core_1.jsonb)('settlement_config').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=schema.js.map