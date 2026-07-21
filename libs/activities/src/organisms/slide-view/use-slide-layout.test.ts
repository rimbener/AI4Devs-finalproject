jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (values: Record<string, unknown>) => values.ios ?? values.default,
  },
  useWindowDimensions: jest.fn(),
}));

import type { SlideImageRef } from '@helsoft/types';
import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';

import { useSlideLayout } from './use-slide-layout';

const mockedUseWindowDimensions = jest.mocked(useWindowDimensions);

const portraitImage: SlideImageRef = {
  imageId: 'image-1',
  storagePath: 'slides/image-1.png',
  width: 400,
  height: 800,
};

describe('useSlideLayout', () => {
  beforeEach(() => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 1024,
      height: 768,
      scale: 1,
      fontScale: 1,
    });
  });

  // @s1, @s4, @s5 — every valid image shape splits in a measured landscape pane.
  it.each([
    ['portrait', portraitImage],
    ['landscape', { ...portraitImage, width: 800, height: 400 }],
    ['square', { ...portraitImage, width: 400, height: 400 }],
  ] as const)('selects split layout for a %s image in landscape', async (_shape, image) => {
    const { result } = await renderHook(() => useSlideLayout({ image, availableHeight: 600 }));

    expect(result.current).toEqual({ isSplit: true });
  });

  // @s9 — invalid image dimensions stay stacked.
  it.each([
    ['a zero-width image', { ...portraitImage, width: 0 }],
    ['a zero-height image', { ...portraitImage, height: 0 }],
    ['a negative-size image', { ...portraitImage, width: -1 }],
    ['no image', undefined],
  ] as const)('keeps %s stacked', async (_description, image) => {
    const { result } = await renderHook(() => useSlideLayout({ image, availableHeight: 600 }));

    expect(result.current).toEqual({ isSplit: false });
  });

  // @s6, @s8 — a portrait image requires landscape orientation and positive measured height.
  it.each([
    ['a portrait viewport', { width: 768, height: 1024 }, 600],
    ['a square viewport', { width: 800, height: 800 }, 600],
    ['no measured height', { width: 1024, height: 768 }, undefined],
    ['a null height', { width: 1024, height: 768 }, null],
    ['a zero height', { width: 1024, height: 768 }, 0],
  ] as const)('keeps stacked for %s', async (_description, dimensions, availableHeight) => {
    mockedUseWindowDimensions.mockReturnValue({ ...dimensions, scale: 1, fontScale: 1 });

    const { result } = await renderHook(() =>
      useSlideLayout({ image: portraitImage, availableHeight }),
    );

    expect(result.current).toEqual({ isSplit: false });
  });

  // @s10 — viewport rotation recomputes the layout decision.
  it('switches between split and stacked as the viewport rotates', async () => {
    const { result, rerender } = await renderHook(() =>
      useSlideLayout({ image: portraitImage, availableHeight: 600 }),
    );

    expect(result.current).toEqual({ isSplit: true });

    mockedUseWindowDimensions.mockReturnValue({
      width: 768,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });
    await rerender(undefined);
    expect(result.current).toEqual({ isSplit: false });
  });
});
