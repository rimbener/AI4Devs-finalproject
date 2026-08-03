import { focusDialog } from '@helsoft/components';
import { useSlideImageUrl } from '@helsoft/hooks';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import { getContainedImageSize } from './slide-image.helpers';
import type { PaneSize, SlideImageProps } from './slide-image.types';

type UseSlideImageArgs = Pick<SlideImageProps, 'image' | 'layout'>;

/**
 * Local lightbox + split-pane sizing for SlideImage. Handlers stay in the component.
 */
export const useSlideImage = ({ image, layout = 'stacked' }: UseSlideImageArgs) => {
  const { url } = useSlideImageUrl(image);
  const [open, setOpen] = useState(false);
  const [paneSize, setPaneSize] = useState<PaneSize>();
  const expandControlRef = useRef<View>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open && wasOpen.current) {
      focusDialog(expandControlRef);
    }
    wasOpen.current = open;
  }, [open]);

  const aspectRatio = image && image.width > 0 && image.height > 0 ? image.width / image.height : 1;
  const containedSize =
    layout === 'split' && paneSize ? getContainedImageSize(aspectRatio, paneSize) : undefined;

  const onPaneLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setPaneSize({ width, height });
  };

  return {
    url,
    open,
    setOpen,
    expandControlRef,
    aspectRatio,
    containedSize,
    onPaneLayout,
    layout,
  };
};
