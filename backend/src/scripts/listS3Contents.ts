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
  console.log(`📦 Listing contents of S3 bucket: ${BUCKET_NAME}\n`);

  try {
    const result = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();

    if (!result.Contents || result.Contents.length === 0) {
      console.log('Bucket is empty');
      return;
    }

    console.log(`Found ${result.Contents.length} files:\n`);
    for (const obj of result.Contents) {
      const sizeKB = ((obj.Size || 0) / 1024).toFixed(2);
      console.log(`  ${obj.Key} (${sizeKB} KB)`);
    }
  } catch (error) {
    console.error('❌ Failed to list bucket contents:', error);
    process.exit(1);
  }
}

main();
