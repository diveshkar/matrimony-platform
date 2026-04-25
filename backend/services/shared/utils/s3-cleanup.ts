import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { logger } from './logger.js';

let _s3: S3Client | null = null;

function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-1' });
  }
  return _s3;
}

function getMediaBucket(): string | null {
  return process.env.S3_MEDIA_BUCKET || null;
}

/**
 * Delete a single object from the media bucket. Best-effort —
 * logs at error level on failure but does not throw, so callers
 * that already deleted the DB row aren't blocked.
 */
export async function deleteMediaObject(s3Key: string): Promise<void> {
  const bucket = getMediaBucket();
  if (!bucket) return; // dev/local — no-op
  try {
    await getS3().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }),
    );
  } catch (err) {
    logger.error('Failed to delete S3 object', { s3Key, error: String(err) });
  }
}

/**
 * Delete every object under photos/{userId}/ from the media bucket.
 * Used when an account is hard-deleted so user-uploaded photos don't
 * linger in S3 after the DB rows are gone.
 *
 * Paginates through ListObjectsV2 results because a user could have
 * uploaded more than the default 1000-object page size over time.
 */
export async function deleteUserPhotos(userId: string): Promise<void> {
  const bucket = getMediaBucket();
  if (!bucket) return;

  const prefix = `photos/${userId}/`;
  const s3 = getS3();
  let continuationToken: string | undefined;
  let totalDeleted = 0;

  do {
    const listResult = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const objects = listResult.Contents || [];
    for (const obj of objects) {
      if (!obj.Key) continue;
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
        totalDeleted++;
      } catch (err) {
        logger.error('Failed to delete S3 object during user-photo sweep', {
          userId,
          s3Key: obj.Key,
          error: String(err),
        });
      }
    }

    continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
  } while (continuationToken);

  logger.info('Deleted user photos from S3', { userId, totalDeleted });
}
