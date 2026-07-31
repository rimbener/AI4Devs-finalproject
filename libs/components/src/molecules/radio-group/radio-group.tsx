import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { RadioGroupProps, RadioOption } from './radio-group.types';

/**
 * RadioGroup — MD3 single-select. Renders a list of radio options.
 */
export const RadioGroup = ({
  options = [],
  value,
  onChange,
  disabled = false,
  direction = 'column',
  style,
  accessibilityLabel,
}: RadioGroupProps) => {
  const norm: RadioOption[] = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.group(direction), style]}
    >
      {norm.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            aria-checked={selected}
            disabled={disabled}
            onPress={() => onChange?.(opt.value)}
            style={styles.option(disabled)}
          >
            <View style={styles.ring(selected)}>
              {selected ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.label}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  group: (direction: 'column' | 'row') => ({
    flexDirection: direction,
    gap: direction === 'row' ? theme.spacing.s5 : theme.spacing.s2,
  }),
  option: (disabled: boolean) => ({
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: theme.spacing.s3,
    opacity: disabled ? theme.disabledOpacity : 1,
  }),
  ring: (selected: boolean) => ({
    width: theme.spacing.s5,
    height: theme.spacing.s5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.full,
    borderWidth: 2,
    borderColor: selected ? theme.colors.primary : theme.colors.onSurfaceVariant,
  }),
  dot: {
    width: theme.spacing.s5 / 2,
    height: theme.spacing.s5 / 2,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.primary,
  },
  label: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
}));
