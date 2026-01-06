/**
 * Create S3 Bucket for YC Data
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-2',
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'zatanna-yc-data';

async function main() {
  console.log(`🪣 Creating S3 bucket: ${BUCKET_NAME}`);

  try {
    await s3.createBucket({
      Bucket: BUCKET_NAME,
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-2'
      }
    }).promise();

    console.log(`✅ Bucket created successfully: ${BUCKET_NAME}`);
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
      console.log(`✅ Bucket already exists: ${BUCKET_NAME}`);
      process.exit(0);
    }

    console.error('❌ Failed to create bucket:', error);
    process.exit(1);
  }
}

main();
