import type { StyleProp, ViewStyle } from 'react-native';

export type RadioOption = { value: string; label: string };

export type RadioGroupProps = {
  options?: Array<RadioOption | string>;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  direction?: 'column' | 'row';
  style?: StyleProp<ViewStyle>;
  /** Accessible name for the whole group (e.g. "Lesson content") — WCAG 1.3.1/4.1.2, mirrors
   * `LanguageSelector`'s own `accessibilityLabel` prop. */
  accessibilityLabel?: string;
};
