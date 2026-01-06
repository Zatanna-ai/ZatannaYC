import AWS from 'aws-sdk';
import { s3Logger } from '../utils/logger';
import { db } from '../database/connection';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-2',
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'zatanna-yc-data';

export class S3DataSync {
  /**
   * Export YC case session data to S3
   * Exports persons, datapoints, and entity index for a specific case session
   * If case_session_id is empty in DB, exports by organization_id instead
   */
  static async exportCaseSessionToS3(caseSessionId: string): Promise<void> {
    s3Logger.info({ caseSessionId }, 'Starting case session export to S3');

    try {
      const dbInstance = await db;

      // Check if persons have case_session_id set
      const testPerson = await dbInstance
        .selectFrom('person')
        .select('case_session_id')
        .where('organization_id', '=', process.env.YC_ORGANIZATION_ID || '78e0a525-cc65-44c1-be05-93bb55247fde')
        .limit(1)
        .executeTakeFirst();

      const useCaseSessionId = testPerson?.case_session_id ? true : false;
      s3Logger.info({ useCaseSessionId }, 'Export strategy');

      // Export persons
      s3Logger.info('Exporting persons...');
      let personsQuery = dbInstance.selectFrom('person').selectAll();

      if (useCaseSessionId) {
        personsQuery = personsQuery.where('case_session_id', '=', caseSessionId);
      } else {
        // Fall back to organization_id if case_session_id is not set
        personsQuery = personsQuery.where('organization_id', '=', process.env.YC_ORGANIZATION_ID || '78e0a525-cc65-44c1-be05-93bb55247fde');
      }

      const persons = await personsQuery.execute();

      await this.uploadToS3(
        `case-sessions/${caseSessionId}/persons.json.gz`,
        JSON.stringify(persons)
      );
      s3Logger.info({ count: persons.length }, 'Persons exported');

      // Export datapoint_entity_index for these persons
      s3Logger.info('Exporting datapoint entity index...');
      const personIds = persons.map(p => p.id);

      // Process in batches to avoid memory issues
      const batchSize = 1000;
      let allIndexEntries: any[] = [];

      for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        const indexEntries = await dbInstance
          .selectFrom('datapoint_entity_index')
          .selectAll()
          .where('person_id', 'in', batch)
          .execute();
        allIndexEntries.push(...indexEntries);
      }

      await this.uploadToS3(
        `case-sessions/${caseSessionId}/datapoint_entity_index.json.gz`,
        JSON.stringify(allIndexEntries)
      );
      s3Logger.info({ count: allIndexEntries.length }, 'Datapoint entity index exported');

      // Export person_datapoints
      s3Logger.info('Exporting person datapoints...');
      let allDatapoints: any[] = [];

      for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        const datapoints = await dbInstance
          .selectFrom('person_datapoints')
          .selectAll()
          .where('person_id', 'in', batch)
          .execute();
        allDatapoints.push(...datapoints);
      }

      await this.uploadToS3(
        `case-sessions/${caseSessionId}/person_datapoints.json.gz`,
        JSON.stringify(allDatapoints)
      );
      s3Logger.info({ count: allDatapoints.length }, 'Person datapoints exported');

      // Export canonical entities (shared across all case sessions)
      s3Logger.info('Exporting canonical entities...');
      const canonicalEntities = await dbInstance
        .selectFrom('canonical_entities')
        .selectAll()
        .execute();

      await this.uploadToS3(
        `shared/canonical_entities.json.gz`,
        JSON.stringify(canonicalEntities)
      );
      s3Logger.info({ count: canonicalEntities.length }, 'Canonical entities exported');

      s3Logger.info({ caseSessionId }, 'Case session export completed successfully');
    } catch (error) {
      s3Logger.error({ error, caseSessionId }, 'Failed to export case session to S3');
      throw error;
    }
  }

  /**
   * Import YC case session data from S3
   */
  static async importCaseSessionFromS3(caseSessionId: string): Promise<void> {
    s3Logger.info({ caseSessionId }, 'Starting case session import from S3');

    try {
      const dbInstance = await db;

      // Import canonical entities first (if not already present)
      s3Logger.info('Importing canonical entities...');
      const canonicalEntities = await this.downloadFromS3(
        `shared/canonical_entities.json.gz`
      );

      // Check if we need to import canonical entities
      const existingCount = await dbInstance
        .selectFrom('canonical_entities')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirst();

      if (!existingCount || existingCount.count === 0) {
        s3Logger.info('Importing canonical entities...');
        // Insert in batches
        const batchSize = 1000;
        for (let i = 0; i < canonicalEntities.length; i += batchSize) {
          const batch = canonicalEntities.slice(i, i + batchSize);
          await dbInstance.insertInto('canonical_entities').values(batch).execute();
        }
        s3Logger.info({ count: canonicalEntities.length }, 'Canonical entities imported');
      } else {
        s3Logger.info('Canonical entities already exist, skipping');
      }

      // Import persons
      s3Logger.info('Importing persons...');
      const persons = await this.downloadFromS3(
        `case-sessions/${caseSessionId}/persons.json.gz`
      );

      const batchSize = 1000;
      for (let i = 0; i < persons.length; i += batchSize) {
        const batch = persons.slice(i, i + batchSize);
        await dbInstance.insertInto('person').values(batch).execute();
      }
      s3Logger.info({ count: persons.length }, 'Persons imported');

      // Import datapoint_entity_index
      s3Logger.info('Importing datapoint entity index...');
      const indexEntries = await this.downloadFromS3(
        `case-sessions/${caseSessionId}/datapoint_entity_index.json.gz`
      );

      for (let i = 0; i < indexEntries.length; i += batchSize) {
        const batch = indexEntries.slice(i, i + batchSize);
        await dbInstance.insertInto('datapoint_entity_index').values(batch).execute();
      }
      s3Logger.info({ count: indexEntries.length }, 'Datapoint entity index imported');

      // Import person_datapoints
      s3Logger.info('Importing person datapoints...');
      const datapoints = await this.downloadFromS3(
        `case-sessions/${caseSessionId}/person_datapoints.json.gz`
      );

      for (let i = 0; i < datapoints.length; i += batchSize) {
        const batch = datapoints.slice(i, i + batchSize);
        await dbInstance.insertInto('person_datapoints').values(batch).execute();
      }
      s3Logger.info({ count: datapoints.length }, 'Person datapoints imported');

      s3Logger.info({ caseSessionId }, 'Case session import completed successfully');
    } catch (error) {
      s3Logger.error({ error, caseSessionId }, 'Failed to import case session from S3');
      throw error;
    }
  }

  /**
   * Upload data to S3 (with gzip compression)
   */
  private static async uploadToS3(key: string, data: string): Promise<void> {
    const compressed = await gzipAsync(Buffer.from(data));

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: compressed,
        ContentType: 'application/json',
        ContentEncoding: 'gzip',
      })
      .promise();

    s3Logger.debug({ key, size: compressed.length }, 'Uploaded to S3');
  }

  /**
   * Download data from S3 (with gzip decompression)
   */
  private static async downloadFromS3(key: string): Promise<any[]> {
    const result = await s3
      .getObject({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      .promise();

    if (!result.Body) {
      throw new Error(`No data found for key: ${key}`);
    }

    const decompressed = await gunzipAsync(result.Body as Buffer);
    return JSON.parse(decompressed.toString());
  }
}
