import type { RadioOption } from '../radio-group/radio-group.types';

export type RadioGroupSectionProps = {
  title: string;
  options: Array<RadioOption | string>;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  /** Accessible name for the radio group; defaults to `title` when omitted. */
  accessibilityLabel?: string;
};
