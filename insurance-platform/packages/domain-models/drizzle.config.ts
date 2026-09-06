/**
 * Drizzle Kit Configuration
 * 
 * Database: overinsur_db on OVERINSURDATA container (port 5433)
 * Clean installation per V2.1 Design Document
 */

module.exports = {
  schema: './src/schema/index.ts',
  out: './drizzle-out/overinsur',
  driver: 'pg',
  dbCredentials: {
    host: 'localhost',
    port: 5433,
    user: 'overinsur',
    password: 'overinsur123',
    database: 'overinsur_db',
  },
};
