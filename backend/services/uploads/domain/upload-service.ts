import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PhotoRepository } from '../repositories/photo-repository.js';
import { ValidationError, NotFoundError } from '../../shared/errors/app-errors.js';
import type { PhotoMetadata } from '../../../packages/shared-types/index.js';

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class UploadService {
  private repo: PhotoRepository;

  constructor() {
    this.repo = new PhotoRepository();
  }

  async getUploadUrl(
    userId: string,
    fileName: string,
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

    const count = await this.repo.getPhotoCount(userId);
    if (count >= MAX_PHOTOS) {
      throw new ValidationError(`Maximum ${MAX_PHOTOS} photos allowed`);
    }

    const ext = fileName.split('.').pop() || 'jpg';
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
