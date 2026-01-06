import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { dbLogger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Database types (simplified - can be expanded later)
interface Database {
  person: any;
  person_datapoints: any;
  datapoint_entity_index: any;
  canonical_entities: any;
  canonical_entity_relationships: any;
}

// Create PostgreSQL connection pool
const createPool = (): Pool => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  });

  dbLogger.info({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
  }, 'Database pool created');

  return pool;
};

// Create Kysely database instance
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: createPool(),
  }),
});

// Test database connection
export const testConnection = async () => {
  try {
    await db.selectFrom('person').select('id').limit(1).execute();
    dbLogger.info('Database connection successful');
    return true;
  } catch (error) {
    dbLogger.error({ error }, 'Database connection failed');
    return false;
  }
};
