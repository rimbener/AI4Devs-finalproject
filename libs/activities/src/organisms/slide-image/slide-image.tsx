import { focusDialog, IconButton, ImageLightbox } from '@helsoft/components';
import { useSlideImageUrl } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useEffect, useRef, useState } from 'react';
import { Image, View as NativeView, type View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { SlideImageProps } from './slide-image.types';

/**
 * SlideImage — resolves a signed URL via useSlideImageUrl and renders it scaled to fit.
 * Renders nothing when there is no url (text-only degrade).
 */
export const SlideImage = ({ image, layout = 'stacked' }: SlideImageProps) => {
  const { url } = useSlideImageUrl(image);
  const { t } = useLocalization();
  const { theme } = useUnistyles();
  const [open, setOpen] = useState(false);
  const expandControlRef = useRef<View>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open && wasOpen.current) {
      focusDialog(expandControlRef);
    }
    wasOpen.current = open;
  }, [open]);

  if (!url || !image) return null;

  const aspectRatio = image.width > 0 && image.height > 0 ? image.width / image.height : 1;

  return (
    <NativeView testID="slide-image-container" style={styles.container}>
      <NativeView testID="slide-image-wrapper" style={styles.imageWrapper(layout)}>
        <Image
          testID="slide-image"
          source={{ uri: url }}
          accessible={Boolean(image.alt)}
          accessibilityLabel={image.alt || undefined}
          resizeMode="contain"
          style={styles.image(aspectRatio, layout)}
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
  container: {
    alignItems: 'center',
  },
  imageWrapper: (layout: NonNullable<SlideImageProps['layout']>) =>
    layout === 'split'
      ? {
          width: '100%' as const,
          maxHeight: '100%' as const,
          flex: 1,
          position: 'relative',
        }
      : {
          width: '100%' as const,
          maxWidth: theme.layout.contentReading,
          position: 'relative',
        },
  image: (aspectRatio: number, layout: NonNullable<SlideImageProps['layout']>) => ({
    width: '100%' as const,
    aspectRatio,
    ...(layout === 'split' && {
      maxHeight: '100%' as const,
      flex: 1,
    }),
  }),
  expandControl: {
    position: 'absolute',
    top: theme.spacing.s2,
    right: theme.spacing.s2,
  },
}));
