# Data Sync Guide - S3 Export/Import

## Overview

The S3 Data Sync service allows you to safely **clone/copy** YC case session data from production to S3, then import it into your local or staging environment.

**SAFETY GUARANTEES:**
- ✅ Export only **reads** from production database (no modifications)
- ✅ Import only **inserts** data (no deletions or updates)
- ✅ Creates complete copies without affecting production data

## Architecture

```
Production DB (RDS)
       ↓ (read-only export)
       ↓
    S3 Bucket (zatanna-yc-data)
       ↓
       ↓ (import via INSERT)
       ↓
Local/Staging DB (PostgreSQL)
```

## Prerequisites

1. **AWS Credentials** with S3 access
2. **Production Database** credentials (read-only access is sufficient for export)
3. **Target Database** (local or staging) for import

## Step 1: Configure Production Environment for Export

Create `/backend/.env.production` with production database credentials:

```bash
# Production Database (READ-ONLY needed for export)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_USER=readonly_user  # Use read-only user for safety
DB_PASSWORD=xxx
DB_NAME=zatanna_prod

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-2
S3_BUCKET_NAME=zatanna-yc-data

# YC Case Session
YC_CASE_SESSION_ID=396f85a7-3e58-4076-9f87-32ddd9f24ee8
```

## Step 2: Export Production Data to S3

**SAFETY:** This only reads from the database. No modifications.

```bash
cd backend

# Install dependencies
npm install

# Run export (reads from production, writes to S3)
NODE_ENV=production npm run export-s3

# Or with explicit case session ID
NODE_ENV=production npm run export-s3 396f85a7-3e58-4076-9f87-32ddd9f24ee8
```

### What Gets Exported

The export creates a complete clone in S3:

```
s3://zatanna-yc-data/
├── case-sessions/
│   └── 396f85a7-3e58-4076-9f87-32ddd9f24ee8/
│       ├── persons.json.gz                    # All founders
│       ├── datapoint_entity_index.json.gz     # Entity relationships
│       └── person_datapoints.json.gz          # All datapoints
└── shared/
    └── canonical_entities.json.gz             # Canonical entities (shared)
```

All files are **gzip compressed** to reduce storage and transfer costs.

### Export Process

1. Queries production DB for all persons with `case_session_id`
2. Queries all related `datapoint_entity_index` entries
3. Queries all related `person_datapoints`
4. Queries all `canonical_entities` (shared reference data)
5. Compresses each dataset with gzip
6. Uploads to S3

**Performance:** Processes in batches of 1000 records to avoid memory issues.

## Step 3: Configure Local Environment for Import

Create `/backend/.env` for your local database:

```bash
# Local/Staging Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=xxx
DB_NAME=zatanna_yc_local

# AWS S3 (same as production)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-2
S3_BUCKET_NAME=zatanna-yc-data

# YC Case Session
YC_CASE_SESSION_ID=396f85a7-3e58-4076-9f87-32ddd9f24ee8
```

## Step 4: Create Local Database

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE zatanna_yc_local;

# Create tables (copy schema from production)
psql -U postgres -d zatanna_yc_local -f schema.sql
```

**Note:** You'll need the schema file from production. Ask your team for the latest schema export.

## Step 5: Import Data from S3

**SAFETY:** This only inserts data. No deletions or updates.

```bash
cd backend

# Run import (downloads from S3, inserts into local DB)
npm run import-s3

# Or with explicit case session ID
npm run import-s3 396f85a7-3e58-4076-9f87-32ddd9f24ee8
```

### Import Process

1. Downloads `canonical_entities` from S3
2. Checks if canonical entities exist locally (skips if present)
3. Downloads `persons` for case session
4. Inserts persons in batches of 1000
5. Downloads and inserts `datapoint_entity_index`
6. Downloads and inserts `person_datapoints`

**Safety Features:**
- Uses `INSERT` only (no `DELETE` or `UPDATE`)
- Processes in batches to avoid memory issues
- Skips canonical entities if already present
- All operations are logged

## Verifying the Data

After import, verify the data:

```bash
psql -U postgres -d zatanna_yc_local

-- Check person count
SELECT COUNT(*) FROM person WHERE case_session_id = '396f85a7-3e58-4076-9f87-32ddd9f24ee8';

-- Check datapoint count
SELECT COUNT(*) FROM person_datapoints;

-- Check canonical entities
SELECT COUNT(*) FROM canonical_entities;

-- Check entity index
SELECT COUNT(*) FROM datapoint_entity_index;
```

## Running the Backend API

Once data is imported:

```bash
cd backend
npm run dev
```

The API will start on `http://localhost:3001` with endpoints:
- `GET /api/v1/yc-dashboard/stats?case_session_id=xxx`
- `GET /api/v1/yc-dashboard/interests/:name/founders`
- `GET /api/v1/yc-founders`
- etc.

## Troubleshooting

### Export fails with "permission denied"
- Ensure AWS credentials have S3 write access
- Check database credentials are correct
- Verify case_session_id exists in production

### Import fails with "duplicate key"
- Data may already be imported
- Check if persons exist: `SELECT COUNT(*) FROM person`
- If needed, drop and recreate database

### Import is slow
- Normal for large datasets (430+ founders)
- Processes in batches of 1000 for memory efficiency
- Can take 5-15 minutes depending on data size

### Canonical entities not found
- Ensure `shared/canonical_entities.json.gz` exists in S3
- Run export again if file is missing
- Check S3 bucket permissions

## Cost Optimization

All data is gzip compressed:
- Reduces S3 storage costs by ~70%
- Reduces data transfer costs
- Speeds up downloads

Typical sizes:
- `persons.json.gz`: ~200KB (430 founders)
- `datapoint_entity_index.json.gz`: ~500KB
- `person_datapoints.json.gz`: ~2MB
- `canonical_entities.json.gz`: ~500KB

**Total:** ~3MB compressed (saves ~10MB compared to uncompressed)

## Security Best Practices

1. **Use Read-Only Credentials for Export**
   - Create a PostgreSQL read-only user
   - Grant only SELECT permission
   - This ensures export cannot modify production

2. **Restrict S3 Access**
   - Use IAM user with minimal permissions
   - Only allow `s3:PutObject` and `s3:GetObject`
   - Restrict to specific bucket

3. **Never Commit .env Files**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as template
   - Store credentials in secure password manager

4. **Use Separate S3 Buckets**
   - Production: `zatanna-yc-data`
   - Staging: `zatanna-yc-data-staging`
   - Dev: `zatanna-yc-data-dev`

## Automation

For regular syncs, you can create a cron job:

```bash
# Export production data to S3 daily at 2 AM
0 2 * * * cd /path/to/backend && NODE_ENV=production npm run export-s3
```

## Support

For issues:
1. Check logs in console output
2. Review S3 bucket contents
3. Verify database credentials
4. Contact team for assistance
