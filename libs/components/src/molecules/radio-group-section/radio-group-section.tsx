import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { RadioGroup } from '../radio-group/radio-group';

import type { RadioGroupSectionProps } from './radio-group-section.types';

/**
 * RadioGroupSection — titled radio group: heading + `RadioGroup` as one molecule.
 * Presentational; caller supplies copy (i18n-free).
 */
export const RadioGroupSection = ({
  title,
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: RadioGroupSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.heading}>{title}</Text>
    <RadioGroup
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? title}
    />
  </View>
);

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.s3,
  },
  heading: {
    ...theme.typography.titleSmall,
    color: theme.colors.onSurfaceVariant,
  },
}));
