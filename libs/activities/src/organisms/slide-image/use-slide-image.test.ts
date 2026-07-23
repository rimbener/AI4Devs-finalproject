jest.mock('@helsoft/hooks', () => ({
  useSlideImageUrl: jest.fn(),
}));

jest.mock('@helsoft/components', () => ({
  focusDialog: jest.fn(),
}));

import { useSlideImageUrl } from '@helsoft/hooks';
import type { SlideImageRef } from '@helsoft/types';
import { act, renderHook } from '@testing-library/react-native';

import { useSlideImage } from './use-slide-image';

const mockUseSlideImageUrl = useSlideImageUrl as jest.Mock;

const imageRef: SlideImageRef = {
  imageId: 'img-1',
  storagePath: 'user/doc/img.png',
  width: 400,
  height: 200,
  alt: 'Diagram',
};

describe('useSlideImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSlideImageUrl.mockReturnValue({ url: 'https://example.com/signed.png', isLoading: false });
  });

  // Mutation — default `layout = 'stacked'` → `layout = ""` (must stay stacked).
  it('defaults layout to stacked when omitted', async () => {
    const { result } = await renderHook(() => useSlideImage({ image: imageRef }));

    expect(result.current?.layout).toBe('stacked');
  });

  // Mutation — `layout === 'split' && paneSize` → `true && paneSize`: stacked must ignore pane.
  it('does not compute containedSize for stacked layout even after pane layout', async () => {
    const { result } = await renderHook(() =>
      useSlideImage({ image: imageRef, layout: 'stacked' }),
    );

    await act(async () => {
      result.current?.onPaneLayout({
        nativeEvent: { layout: { width: 240, height: 300, x: 0, y: 0 } },
      } as Parameters<NonNullable<typeof result.current>['onPaneLayout']>[0]);
    });

    expect(result.current?.containedSize).toBeUndefined();
  });

  it('computes containedSize for split layout after a non-zero pane layout', async () => {
    const { result } = await renderHook(() => useSlideImage({ image: imageRef, layout: 'split' }));

    await act(async () => {
      result.current?.onPaneLayout({
        nativeEvent: { layout: { width: 240, height: 300, x: 0, y: 0 } },
      } as Parameters<NonNullable<typeof result.current>['onPaneLayout']>[0]);
    });

    expect(result.current?.containedSize).toEqual({ width: 240, height: 120 });
  });
});
