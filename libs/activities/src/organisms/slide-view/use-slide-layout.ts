import type { SlideImageRef } from '@helsoft/types';
import * as ReactNative from 'react-native';

type UseSlideLayoutArgs = {
  image?: SlideImageRef;
  availableHeight?: number | null;
};

type SlideLayout = {
  isSplit: boolean;
};

export const useSlideLayout = ({ image, availableHeight }: UseSlideLayoutArgs): SlideLayout => {
  const window = ReactNative.useWindowDimensions();
  const hasValidImageDimensions = Boolean(image && image.width > 0 && image.height > 0);
  const isLandscapeViewport = window.width > window.height;
  const hasAvailableHeight = availableHeight != null && availableHeight > 0;

  return {
    isSplit: hasValidImageDimensions && isLandscapeViewport && hasAvailableHeight,
  };
};
