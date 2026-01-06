/**
 * Export YC Case Session Data to S3 from Monorepo DB
 *
 * This script connects to the same database as the monorepo backend
 * and exports the YC case session data to S3.
 *
 * SAFETY: Only reads from database, no modifications
 */

import dotenv from 'dotenv';
import { S3DataSync } from '../services/s3DataSync';
import { logger } from '../utils/logger';
import { db } from '../database/connection';

// Load environment variables
dotenv.config();

const CASE_SESSION_ID = '396f85a7-3e58-4076-9f87-32ddd9f24ee8';

async function main() {
  logger.info('🚀 Starting YC Case Session Export to S3');
  logger.info({
    caseSessionId: CASE_SESSION_ID,
    bucket: process.env.S3_BUCKET_NAME || 'zatanna-yc-data',
    database: process.env.DB_NAME
  }, '📋 Export Configuration');

  console.log('\n⚠️  SAFETY CHECK:');
  console.log('   ✅ This script only READS from the database');
  console.log('   ✅ No deletions or modifications will be made');
  console.log('   ✅ Creates a complete copy in S3\n');

  // Test database connection first
  try {
    const testQuery = await db.selectFrom('person')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('case_session_id', '=', CASE_SESSION_ID)
      .executeTakeFirst();

    console.log(`📊 Found ${testQuery?.count || 0} persons with case_session_id: ${CASE_SESSION_ID}`);

    if (!testQuery?.count || testQuery.count === 0) {
      console.log('\n⚠️  WARNING: No persons found with this case_session_id');
      console.log('   The database might be empty or using a different case_session_id');
      console.log('   Continuing anyway...\n');
    }
  } catch (error) {
    logger.error({ error }, '❌ Database connection test failed');
    console.error('\n❌ Database connection failed:', error);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database credentials in .env are correct');
    console.error('  3. Database "nopoll" exists');
    process.exit(1);
  }

  try {
    await S3DataSync.exportCaseSessionToS3(CASE_SESSION_ID);

    console.log('\n✅ Export completed successfully!');
    console.log(`📦 Data exported to S3: s3://${process.env.S3_BUCKET_NAME}/case-sessions/${CASE_SESSION_ID}/`);
    console.log('\nExported files:');
    console.log(`   - persons.json.gz`);
    console.log(`   - datapoint_entity_index.json.gz`);
    console.log(`   - person_datapoints.json.gz`);
    console.log(`   - shared/canonical_entities.json.gz`);

    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Export failed');
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

main();
