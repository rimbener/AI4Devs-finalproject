import type { StyleProp, ViewStyle } from 'react-native';

export type ProgressIndicatorVariant = 'linear' | 'circular';

export type ProgressIndicatorProps = {
  variant?: ProgressIndicatorVariant;
  /** 0–100. Omit for an indeterminate/animated state. */
  value?: number;
  /** Circular diameter. */
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  /** Accessible name for the progressbar (WCAG 4.1.2). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export type IndeterminateTiming = {
  duration: number;
  useNativeDriver: boolean;
};
