/**
 * OverInsur (ovwr) Drizzle Client
 * 
 * DEPRECATED: This file is retained for backward compatibility only.
 * All new code should import from './drizzle.client' directly.
 * 
 * The separate connection pool has been removed to avoid resource conflicts.
 * Both schemas (carrier + ovwr) now share the same pool via drizzle.client.ts.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from './drizzle.client';
import * as ovwrSchema from '@overinsur/domain-models';

// Reuse the shared pool from drizzle.client.ts (no separate connection pool)
export const ovwrPool = pool;
export const ovwrDb = drizzle(pool, { schema: ovwrSchema });

export default ovwrDb;
