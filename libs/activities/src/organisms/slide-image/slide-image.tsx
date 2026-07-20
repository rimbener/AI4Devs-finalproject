import { IconButton, ImageLightbox } from '@helsoft/components';
import { useSlideImageUrl } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { SlideImageProps } from './slide-image.types';

/**
 * SlideImage — resolves a signed URL via useSlideImageUrl and renders it scaled to fit.
 * Renders nothing when there is no url (text-only degrade).
 */
export const SlideImage = ({ image }: SlideImageProps) => {
  const { url } = useSlideImageUrl(image);
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  if (!url || !image) return null;

  const aspectRatio = image.width > 0 && image.height > 0 ? image.width / image.height : 1;

  return (
    <View testID="slide-image-container" style={styles.container}>
      <View testID="slide-image-wrapper" style={styles.imageWrapper}>
        <Image
          testID="slide-image"
          source={{ uri: url }}
          accessible={Boolean(image.alt)}
          accessibilityLabel={image.alt || undefined}
          resizeMode="contain"
          style={styles.image(aspectRatio)}
        />
        <View style={styles.expandControl}>
          <IconButton
            icon="open_in_full"
            accessibilityLabel={t('player.slideImage.expand')}
            onPress={() => setOpen(true)}
          />
        </View>
      </View>
      <ImageLightbox
        visible={open}
        source={{ uri: url }}
        alt={image.alt ?? ''}
        closeLabel={t('player.slideImage.close')}
        onRequestClose={() => setOpen(false)}
      />
    </View>
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
