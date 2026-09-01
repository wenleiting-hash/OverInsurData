import * as schema from './schema';
export declare const pool: any;
declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema>;
export default db;
