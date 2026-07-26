import { LessonImageService, SIGNED_URL_TTL_SECONDS } from '@helsoft/supabase-services';
import type { SlideImageRef } from '@helsoft/types';
import { useQuery } from '@tanstack/react-query';

import type { UseSlideImageUrlResult } from './use-slide-image-url.types';

/** Query key for a signed slide-image url, scoped by storage path. */
export const slideImageQueryKey = (storagePath: string) => ['lesson-image', storagePath] as const;

// Cache window derived from the published signed-URL TTL (D6): both windows sit 60s under it
// so a served cache hit is always still a valid, unexpired URL.
const CACHE_WINDOW_MS = (SIGNED_URL_TTL_SECONDS - 60) * 1000;

/**
 * Resolves a short-lived signed URL for a slide image ref. Returns `{ url: null }` when
 * the ref is absent or resolution fails — never throws.
 */
export const useSlideImageUrl = (imageRef?: SlideImageRef): UseSlideImageUrlResult => {
  const storagePath = imageRef?.storagePath;

  const { data, isLoading } = useQuery({
    queryKey: slideImageQueryKey(storagePath ?? ''),
    queryFn: () => LessonImageService.getSignedImageUrl(storagePath as string),
    enabled: Boolean(storagePath),
    staleTime: CACHE_WINDOW_MS,
    gcTime: CACHE_WINDOW_MS,
  });

  return { url: data ?? null, isLoading };
};
