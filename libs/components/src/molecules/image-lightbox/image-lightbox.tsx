import { useRef } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { IconButton } from '../../atoms/icon-button/icon-button';
import { layout } from '../../theme/spacing';

import { focusDialog } from './image-lightbox.helpers';
import type { ImageLightboxProps } from './image-lightbox.types';

export const ImageLightbox = ({
  visible,
  source,
  alt,
  closeLabel,
  dialogLabel,
  onRequestClose,
}: ImageLightboxProps) => {
  const dialogRef = useRef<View>(null);

  return (
    <Modal
      testID="image-lightbox-modal"
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
      onShow={() => focusDialog(dialogRef)}
    >
      <Pressable testID="image-lightbox-backdrop" onPress={onRequestClose} style={styles.scrim}>
        <Pressable
          ref={dialogRef}
          testID="image-lightbox-content"
          accessible
          focusable
          accessibilityLabel={dialogLabel}
          role="dialog"
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          style={styles.content}
        >
          <Image
            testID="image-lightbox-image"
            source={source}
            accessible={Boolean(alt)}
            accessibilityLabel={alt || undefined}
            resizeMode="contain"
            style={styles.image}
          />
          <View testID="image-lightbox-close-control" style={styles.closeControl}>
            <IconButton
              icon="close"
              variant="filled"
              size={layout.touchTarget}
              accessibilityLabel={closeLabel}
              onPress={onRequestClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create((theme) => ({
  scrim: {
    flex: 1,
    padding: theme.spacing.s4,
    backgroundColor: theme.colors.scrim,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeControl: {
    position: 'absolute',
    top: theme.spacing.s4,
    right: theme.spacing.s4,
  },
}));
