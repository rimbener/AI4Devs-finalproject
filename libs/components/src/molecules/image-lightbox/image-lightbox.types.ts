import type { ImageSourcePropType } from 'react-native';

export type ImageLightboxProps = {
  visible: boolean;
  source: ImageSourcePropType;
  alt: string;
  closeLabel: string;
  dialogLabel: string;
  onRequestClose: () => void;
};
