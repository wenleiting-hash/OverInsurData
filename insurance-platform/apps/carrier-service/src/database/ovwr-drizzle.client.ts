/**
 * OverInsur (ovwr) Drizzle Client
 * 
 * Uses the shared domain-models package with ovwr_ prefixed tables
 * Connects to ai_saas database in the existing PostgreSQL container
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as ovwrSchema from '@overinsur/domain-models';

// PostgreSQL connection pool (using existing Docker container)
export const ovwrPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_saas', // Changed from carrier_subsystem to ai_saas
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance with ovwr schema
export const ovwrDb = drizzle(ovwrPool, { schema: ovwrSchema });

export default ovwrDb;
