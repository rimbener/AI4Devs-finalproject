import type { StyleProp, ViewStyle } from 'react-native';

export type AnswerOptionState = 'default' | 'selected' | 'correct' | 'incorrect';

export type AnswerOptionProps = {
  label: string;
  /** Letter marker (A/B/C…). */
  marker: string;
  state?: AnswerOptionState;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Overrides the computed accessible name (default: `"{marker} {label}"`). Composers that add a
   * feedback icon alongside the label (e.g. the `correct`/`incorrect` states) should pass this
   * explicitly instead of relying on RN's default child-text concatenation — otherwise the icon's
   * internal Material Symbols ligature name (e.g. "check_circle") leaks into the accessible name.
   */
  accessibilityLabel?: string;
};
