import { IconButton, ImageLightbox } from '@helsoft/components';
import { useSlideImageUrl } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, View as NativeView, type View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { SlideImageProps } from './slide-image.types';

/**
 * SlideImage — resolves a signed URL via useSlideImageUrl and renders it scaled to fit.
 * Renders nothing when there is no url (text-only degrade).
 */
export const SlideImage = ({ image }: SlideImageProps) => {
  const { url } = useSlideImageUrl(image);
  const { t } = useLocalization();
  const { theme } = useUnistyles();
  const [open, setOpen] = useState(false);
  const expandControlRef = useRef<View>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open && wasOpen.current && expandControlRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(expandControlRef.current, 'focus');
    }
    wasOpen.current = open;
  }, [open]);

  if (!url || !image) return null;

  const aspectRatio = image.width > 0 && image.height > 0 ? image.width / image.height : 1;

  return (
    <NativeView testID="slide-image-container" style={styles.container}>
      <NativeView testID="slide-image-wrapper" style={styles.imageWrapper}>
        <Image
          testID="slide-image"
          source={{ uri: url }}
          accessible={Boolean(image.alt)}
          accessibilityLabel={image.alt || undefined}
          resizeMode="contain"
          style={styles.image(aspectRatio)}
        />
        <NativeView testID="slide-image-expand-control" style={styles.expandControl}>
          <IconButton
            ref={expandControlRef}
            icon="open_in_full"
            variant="filled"
            size={theme.layout.touchTarget}
            accessibilityLabel={t('player.slideImage.expand')}
            onPress={() => setOpen(true)}
          />
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
  imageWrapper: {
    width: '100%' as const,
    maxWidth: theme.layout.contentReading,
    position: 'relative',
  },
  image: (aspectRatio: number) => ({
    width: '100%' as const,
    aspectRatio,
  }),
  expandControl: {
    position: 'absolute',
    top: theme.spacing.s2,
    right: theme.spacing.s2,
  },
}));
