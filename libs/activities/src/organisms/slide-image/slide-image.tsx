import { IconButton, ImageLightbox } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Image, View as NativeView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { PaneSize } from './slide-image.helpers';
import type { SlideImageProps } from './slide-image.types';
import { useSlideImage } from './use-slide-image';

/**
 * SlideImage — resolves a signed URL via useSlideImageUrl and renders it scaled to fit.
 * Renders nothing when there is no url (text-only degrade).
 */
export const SlideImage = ({ image, layout = 'stacked' }: SlideImageProps) => {
  const { t } = useLocalization();
  const { theme } = useUnistyles();
  const { url, open, setOpen, expandControlRef, aspectRatio, containedSize, onPaneLayout } =
    useSlideImage({ image, layout });

  if (!url || !image) return null;

  return (
    <NativeView testID="slide-image-container" style={styles.container(layout)}>
      <NativeView
        testID="slide-image-wrapper"
        style={styles.imageWrapper(layout)}
        onLayout={layout === 'split' ? onPaneLayout : undefined}
      >
        <Image
          testID="slide-image"
          source={{ uri: url }}
          accessible={Boolean(image.alt)}
          accessibilityLabel={image.alt || undefined}
          resizeMode="contain"
          style={styles.image(aspectRatio, layout, containedSize)}
        />
        <NativeView testID="slide-image-expand-control" style={styles.expandControl}>
          <NativeView
            ref={expandControlRef}
            accessible
            focusable
            testID="slide-image-expand-focus-target"
          >
            <IconButton
              icon="open_in_full"
              variant="filled"
              size={theme.layout.touchTarget}
              accessibilityLabel={t('player.slideImage.expand')}
              onPress={() => setOpen(true)}
            />
          </NativeView>
        </NativeView>
      </NativeView>
      <ImageLightbox
        visible={open}
        source={{ uri: url }}
        alt={image.alt ?? ''}
        closeLabel={t('player.slideImage.close')}
        dialogLabel={t('player.slideImage.dialog')}
        onRequestClose={() => setOpen(false)}
      />
    </NativeView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: (layout: NonNullable<SlideImageProps['layout']>) => ({
    alignItems: 'center',
    // TODO: fix this — Stryker survivors on height: '100%' style branch; see
    // docs/features/activity-image-split-layout/mutation.md. Tests don't bite yet.
    ...(layout === 'split' && { height: '100%' as const }),
  }),
  imageWrapper: (layout: NonNullable<SlideImageProps['layout']>) =>
    layout === 'split'
      ? {
          width: '100%' as const,
          height: '100%' as const,
          position: 'relative',
        }
      : {
          width: '100%' as const,
          maxWidth: theme.layout.contentReading,
          position: 'relative',
        },
  image: (
    aspectRatio: number,
    layout: NonNullable<SlideImageProps['layout']>,
    containedSize?: PaneSize,
  ) => ({
    ...(layout === 'split'
      ? (containedSize ?? { width: '100%' as const, height: '100%' as const })
      : { width: '100%' as const, aspectRatio }),
  }),
  expandControl: {
    position: 'absolute',
    top: theme.spacing.s2,
    right: theme.spacing.s2,
  },
}));
