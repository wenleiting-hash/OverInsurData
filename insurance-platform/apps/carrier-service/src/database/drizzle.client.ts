import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// PostgreSQL connection pool (using existing Docker container)
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_saas', // Changed from carrier_subsystem to ai_saas
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// NOTE: Search path is now set globally in PostgreSQL for all roles
// ALTER ROLE postgres SET search_path TO public,insurance_carrier,insurance_product,ovwr_auth;
// No need to execute pool.query() here - it causes connection timeout issues

// Create Drizzle instance
const db = drizzle(pool, { schema });

export default db;
