import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PhotoRepository } from '../repositories/photo-repository.js';
import { ValidationError, NotFoundError } from '../../shared/errors/app-errors.js';
import type { PhotoMetadata } from '../../../packages/shared-types/index.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_LIMITS: Record<string, number> = { free: 3, silver: 6, gold: 6, platinum: 6 };

export class UploadService {
  private repo: PhotoRepository;

  constructor() {
    this.repo = new PhotoRepository();
  }

  async getUploadUrl(
    userId: string,
    _fileName: string,
    mimeType: string,
    fileSize: number,
  ): Promise<{
    uploadUrl: string;
    photoId: string;
    s3Key: string;
  }> {
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new ValidationError(`File type not allowed. Use: ${ALLOWED_TYPES.join(', ')}`);
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new ValidationError('File size must be under 5MB');
    }

    const { SubscriptionRepository } = await import('../../subscriptions/repositories/subscription-repository.js');
    const subRepo = new SubscriptionRepository();
    const entitlement = await subRepo.getUserEntitlement(userId);
    const sub = await subRepo.getSubscription(userId);
    const planId = sub?.status === 'active' ? sub.planId : 'free';
    const maxPhotos = UPLOAD_LIMITS[planId] || 3;

    const count = await this.repo.getPhotoCount(userId);
    if (count >= maxPhotos) {
      throw new ValidationError(
        maxPhotos < 6
          ? `Free plan allows ${maxPhotos} photos. Upgrade to Silver+ to upload up to 6.`
          : `Maximum ${maxPhotos} photos allowed`,
      );
    }

    void entitlement;

    const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const ext = mimeToExt[mimeType] || 'jpg';
    const s3Key = `photos/${userId}/${Date.now()}.${ext}`;
    const bucket = process.env.S3_MEDIA_BUCKET;
    const isLocal = !bucket || process.env.ENVIRONMENT === 'dev';

    let uploadUrl: string;
    if (isLocal) {
      uploadUrl = `http://localhost:4000/uploads/file`;
    } else {
      const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
      uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          ContentType: mimeType,
        }),
        { expiresIn: 300 },
      );
    }

    return {
      uploadUrl,
      photoId: s3Key,
      s3Key,
    };
  }

  async confirmUpload(
    userId: string,
    data: {
      s3Key: string;
      url: string;
      fileSize: number;
      mimeType: string;
      visibility?: 'all' | 'contacts' | 'hidden';
    },
  ): Promise<PhotoMetadata> {
    if (!data.s3Key.startsWith(`photos/${userId}/`)) {
      throw new ValidationError('Invalid photo key');
    }

    const isLocal = process.env.ENVIRONMENT === 'dev';
    const bucket = process.env.S3_MEDIA_BUCKET;
    if (!isLocal) {
      const validUrlPatterns = [
        `https://${bucket}.s3.`,
        `https://s3.`,
      ];
      if (!validUrlPatterns.some((p) => data.url.startsWith(p))) {
        throw new ValidationError('Invalid photo URL');
      }
    }

    const photo = await this.repo.savePhoto(userId, {
      s3Key: data.s3Key,
      url: data.url,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      visibility: data.visibility || 'all',
    });

    if (photo.isPrimary) {
      await this.updateProfilePhoto(userId, photo.url);
    }

    return photo;
  }

  async getMyPhotos(userId: string): Promise<PhotoMetadata[]> {
    return this.repo.getPhotos(userId);
  }

  async setPrimary(userId: string, photoId: string): Promise<void> {
    const photo = await this.repo.getPhoto(userId, photoId);
    if (!photo) throw new NotFoundError('Photo');

    await this.repo.setPrimary(userId, photoId);
    await this.updateProfilePhoto(userId, photo.url);
  }

  async updateVisibility(
    userId: string,
    photoId: string,
    visibility: 'all' | 'contacts' | 'hidden',
  ): Promise<void> {
    if (visibility !== 'all') {
      const { SubscriptionRepository } = await import('../../subscriptions/repositories/subscription-repository.js');
      const subRepo = new SubscriptionRepository();
      const sub = await subRepo.getSubscription(userId);
      const planId = sub?.status === 'active' ? sub.planId : 'free';
      if (planId === 'free') {
        throw new ValidationError('Photo visibility controls require Silver plan or above. Upgrade to manage who sees your photos.');
      }
    }

    const photo = await this.repo.getPhoto(userId, photoId);
    if (!photo) throw new NotFoundError('Photo');

    await this.repo.updateVisibility(userId, photoId, visibility);
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.repo.getPhoto(userId, photoId);
    if (!photo) throw new NotFoundError('Photo');

    await this.repo.deletePhoto(userId, photoId);

    const remaining = await this.repo.getPhotos(userId);
    const primary = remaining.find((p) => p.isPrimary);
    await this.updateProfilePhoto(userId, primary?.url || '');
  }

  private async updateProfilePhoto(userId: string, url: string): Promise<void> {
    const { BaseRepository } = await import('../../shared/repositories/base-repository.js');
    const coreRepo = new BaseRepository('core');
    try {
      await coreRepo.update(`USER#${userId}`, 'PROFILE#v1', {
        primaryPhotoUrl: url,
      });

      const { DiscoveryService } = await import('../../discovery/domain/discovery-service.js');
      await new DiscoveryService().syncProfileToDiscovery(userId);
    } catch {
      // Profile may not exist yet during onboarding
    }
  }
}
