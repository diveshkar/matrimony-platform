import { BaseRepository } from '../../shared/repositories/base-repository.js';
import { nowISO } from '../../shared/utils/date.js';
import { generateId } from '../../shared/utils/id-generator.js';
import type { PhotoMetadata } from '../../../packages/shared-types/index.js';

export class PhotoRepository extends BaseRepository {
  constructor() {
    super('core');
  }

  async getPhotos(userId: string): Promise<PhotoMetadata[]> {
    const result = await this.query<PhotoMetadata>(`USER#${userId}`);
    return result.items.filter((item) => item.SK.startsWith('PHOTO#'));
  }

  async getPhoto(userId: string, photoId: string): Promise<PhotoMetadata | null> {
    return this.get<PhotoMetadata>(`USER#${userId}`, `PHOTO#${photoId}`);
  }

  async savePhoto(
    userId: string,
    data: {
      s3Key: string;
      url: string;
      fileSize: number;
      mimeType: string;
      visibility: 'all' | 'contacts' | 'hidden';
    },
  ): Promise<PhotoMetadata> {
    const photoId = generateId('PHT');
    const existingPhotos = await this.getPhotos(userId);
    const isPrimary = existingPhotos.length === 0;

    const photo: PhotoMetadata = {
      PK: `USER#${userId}`,
      SK: `PHOTO#${photoId}`,
      userId,
      photoId,
      s3Key: data.s3Key,
      url: data.url,
      isPrimary,
      visibility: data.visibility,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      createdAt: nowISO(),
    };

    await this.put(photo as unknown as Record<string, unknown>);
    return photo;
  }

  async setPrimary(userId: string, photoId: string): Promise<void> {
    const photos = await this.getPhotos(userId);

    for (const photo of photos) {
      const shouldBePrimary = photo.photoId === photoId;
      if (photo.isPrimary !== shouldBePrimary) {
        await this.update(`USER#${userId}`, `PHOTO#${photo.photoId}`, {
          isPrimary: shouldBePrimary,
        });
      }
    }
  }

  async updateVisibility(
    userId: string,
    photoId: string,
    visibility: 'all' | 'contacts' | 'hidden',
  ): Promise<void> {
    await this.update(`USER#${userId}`, `PHOTO#${photoId}`, { visibility });
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.getPhoto(userId, photoId);
    await this.delete(`USER#${userId}`, `PHOTO#${photoId}`);

    if (photo?.isPrimary) {
      const remaining = await this.getPhotos(userId);
      if (remaining.length > 0) {
        await this.update(`USER#${userId}`, `PHOTO#${remaining[0].photoId}`, {
          isPrimary: true,
        });
      }
    }
  }

  async getPhotoCount(userId: string): Promise<number> {
    const photos = await this.getPhotos(userId);
    return photos.length;
  }
}
