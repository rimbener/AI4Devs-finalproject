import type { ImageSourcePropType } from 'react-native';

export type ImageLightboxProps = {
  visible: boolean;
  source: ImageSourcePropType;
  alt: string;
  closeLabel: string;
  onRequestClose: () => void;
};
