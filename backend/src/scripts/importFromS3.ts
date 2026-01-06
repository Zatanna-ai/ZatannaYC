/**
 * Import YC Case Session Data from S3
 *
 * SAFETY: This script only INSERTS data into the target database.
 * It does not delete or modify existing data.
 *
 * Usage:
 *   ts-node src/scripts/importFromS3.ts <case_session_id>
 *
 * Example:
 *   ts-node src/scripts/importFromS3.ts 396f85a7-3e58-4076-9f87-32ddd9f24ee8
 */

import dotenv from 'dotenv';
import { S3DataSync } from '../services/s3DataSync';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const CASE_SESSION_ID = process.argv[2] || process.env.YC_CASE_SESSION_ID;

if (!CASE_SESSION_ID) {
  console.error('❌ Error: case_session_id is required');
  console.error('Usage: ts-node src/scripts/importFromS3.ts <case_session_id>');
  console.error('Or set YC_CASE_SESSION_ID in .env file');
  process.exit(1);
}

async function main() {
  logger.info('🚀 Starting YC Case Session Import from S3');
  logger.info({
    caseSessionId: CASE_SESSION_ID,
    bucket: process.env.S3_BUCKET_NAME || 'zatanna-yc-data',
    database: process.env.DB_HOST
  }, '📋 Import Configuration');

  console.log('\n⚠️  SAFETY CHECK:');
  console.log('   ✅ This script only INSERTS data');
  console.log('   ✅ No deletions or modifications of existing data');
  console.log('   ✅ Downloads from S3 and inserts into target DB\n');

  try {
    await S3DataSync.importCaseSessionFromS3(CASE_SESSION_ID);

    console.log('\n✅ Import completed successfully!');
    console.log(`📦 Data imported from S3: s3://${process.env.S3_BUCKET_NAME}/case-sessions/${CASE_SESSION_ID}/`);

    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Import failed');
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
