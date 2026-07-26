import { LessonImageDao } from '../dao/lesson-image.dao';
import { isValidLessonImageStoragePath } from './lesson-image-path';

/**
 * Short-lived signed URL TTL (seconds). Exported so consumers (e.g. `useSlideImageUrl`) can
 * derive a cache window strictly under this lifetime instead of hard-coding one.
 */
export const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Resolves a short-lived signed URL for a slide image. Failure degrades to `null` (never throws).
 */
export abstract class LessonImageService {
  static async getSignedImageUrl(storagePath: string): Promise<string | null> {
    if (!isValidLessonImageStoragePath(storagePath)) return null;
    try {
      return await LessonImageDao.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    } catch {
      return null;
    }
  }
}
