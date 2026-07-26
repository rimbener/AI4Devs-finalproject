jest.mock('@helsoft/supabase-services', () => ({
  LessonImageService: { getSignedImageUrl: jest.fn() },
  SIGNED_URL_TTL_SECONDS: 300,
}));

import { LessonImageService, SIGNED_URL_TTL_SECONDS } from '@helsoft/supabase-services';
import type { SlideImageRef } from '@helsoft/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { slideImageQueryKey, useSlideImageUrl } from './use-slide-image-url';

const service = LessonImageService as jest.Mocked<typeof LessonImageService>;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const imageRef: SlideImageRef = {
  imageId: 'img-1',
  storagePath: 'user/doc/img.png',
  width: 400,
  height: 300,
  alt: 'A diagram',
};

describe('useSlideImageUrl', () => {
  beforeEach(() => jest.clearAllMocks());

  // Migration anchor — the hook must read/write through the shared TanStack cache under the
  // exported key, not a private useState/requestId slice.
  it('caches the signed url under slideImageQueryKey(storagePath)', async () => {
    service.getSignedImageUrl.mockResolvedValue('https://example.com/signed.png');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(slideImageQueryKey(imageRef.storagePath))).toBe(
      'https://example.com/signed.png',
    );
  });

  // @s24 — both cache windows are derived from the published TTL and strictly under it.
  it('derives staleTime and gcTime from SIGNED_URL_TTL_SECONDS, both under the TTL', async () => {
    service.getSignedImageUrl.mockResolvedValue('https://example.com/signed.png');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: slideImageQueryKey(imageRef.storagePath) });
    expect(query).toBeDefined();
    const options = query?.options as { staleTime?: number };
    const ttlMs = SIGNED_URL_TTL_SECONDS * 1000;

    expect(options.staleTime).toEqual(expect.any(Number));
    expect(options.staleTime as number).toBeGreaterThan(0);
    expect(options.staleTime as number).toBeLessThan(ttlMs);
    expect(query?.gcTime).toBeGreaterThan(0);
    expect(query?.gcTime).toBeLessThan(ttlMs);
  });

  // @s25 — a slide with no image reference never calls the signing service.
  it('returns url null and isLoading false when imageRef is absent', () => {
    const { result } = renderHook(() => useSlideImageUrl(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.url).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(service.getSignedImageUrl).not.toHaveBeenCalled();
  });

  // Mutation-kill — the disabled query for an absent storagePath registers under the exact
  // empty-string-scoped key, not some other placeholder.
  it("registers the disabled query under slideImageQueryKey('') when imageRef is absent", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(() => useSlideImageUrl(undefined), { wrapper: createWrapper(queryClient) });

    expect(queryClient.getQueryCache().find({ queryKey: slideImageQueryKey('') })).toBeDefined();
  });

  // @s26 — a slide with an image reports loading then exposes the signed url.
  it('resolves the signed URL from LessonImageService', async () => {
    service.getSignedImageUrl.mockResolvedValue('https://example.com/signed.png');
    const { result } = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(service.getSignedImageUrl).toHaveBeenCalledWith('user/doc/img.png');
    expect(result.current.url).toBe('https://example.com/signed.png');
  });

  // @s27 — a signing failure degrades to no url without throwing.
  it('returns url null when the service resolves null', async () => {
    service.getSignedImageUrl.mockResolvedValue(null);
    const { result } = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.url).toBeNull();
  });

  // @s28 — a late response for a previous slide image never replaces the newly requested one.
  it('ignores a stale signed URL that resolves after a newer storagePath', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    let resolveSecond: (value: unknown) => void = () => {};
    service.getSignedImageUrl
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)) as never)
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)) as never);

    const { result, rerender } = renderHook(
      ({ ref }: { ref: SlideImageRef }) => useSlideImageUrl(ref),
      { initialProps: { ref: imageRef }, wrapper: createWrapper() },
    );

    rerender({
      ref: { ...imageRef, storagePath: 'user/doc/other.png', imageId: 'img-2' },
    });

    await act(async () => {
      resolveSecond('https://example.com/other.png');
    });
    await waitFor(() => expect(result.current.url).toBe('https://example.com/other.png'));

    await act(async () => {
      resolveFirst('https://example.com/stale.png');
    });

    expect(result.current.url).toBe('https://example.com/other.png');
  });

  // @s29 — re-viewing the same slide inside the cache window skips a second signing call.
  it('serves the cached url without a second signing call within the cache window', async () => {
    service.getSignedImageUrl.mockResolvedValue('https://example.com/signed.png');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const first = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    const second = renderHook(() => useSlideImageUrl(imageRef), {
      wrapper: createWrapper(queryClient),
    });

    expect(second.result.current.isLoading).toBe(false);
    expect(second.result.current.url).toBe('https://example.com/signed.png');
    expect(service.getSignedImageUrl).toHaveBeenCalledTimes(1);
  });
});
