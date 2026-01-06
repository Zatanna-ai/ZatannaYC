/**
 * Export YC Case Session Data to S3
 *
 * SAFETY: This script only READS from the production database.
 * It creates a complete copy/clone in S3 without modifying production data.
 *
 * Usage:
 *   ts-node src/scripts/exportToS3.ts <case_session_id>
 *
 * Example:
 *   ts-node src/scripts/exportToS3.ts 396f85a7-3e58-4076-9f87-32ddd9f24ee8
 */

import dotenv from 'dotenv';
import { S3DataSync } from '../services/s3DataSync';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const CASE_SESSION_ID = process.argv[2] || process.env.YC_CASE_SESSION_ID;

if (!CASE_SESSION_ID) {
  console.error('❌ Error: case_session_id is required');
  console.error('Usage: ts-node src/scripts/exportToS3.ts <case_session_id>');
  console.error('Or set YC_CASE_SESSION_ID in .env file');
  process.exit(1);
}

async function main() {
  logger.info('🚀 Starting YC Case Session Export to S3');
  logger.info({
    caseSessionId: CASE_SESSION_ID,
    bucket: process.env.S3_BUCKET_NAME || 'zatanna-yc-data',
    database: process.env.DB_HOST
  }, '📋 Export Configuration');

  console.log('\n⚠️  SAFETY CHECK:');
  console.log('   ✅ This script only READS from the database');
  console.log('   ✅ No deletions or modifications will be made');
  console.log('   ✅ Creates a complete copy in S3\n');

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
