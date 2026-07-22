import type { StyleProp, ViewStyle } from 'react-native';

export type SlideType = 'lesson' | 'activity';

export type SlideProgressSlide = { type: SlideType };

export type SlideProgressProps = {
  slides?: SlideProgressSlide[];
  /** Index of the active slide. */
  current?: number;
  onSeek?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};
