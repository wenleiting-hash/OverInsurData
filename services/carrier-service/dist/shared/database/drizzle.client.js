"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = require("./schema");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'carrier_subsystem',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.db = (0, node_postgres_1.drizzle)(pool, { schema });
exports.default = exports.db;
//# sourceMappingURL=drizzle.client.js.map