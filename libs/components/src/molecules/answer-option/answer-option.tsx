import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Icon } from '../../atoms/icon/icon';
import type { AnswerOptionProps } from './answer-option.types';

/**
 * AnswerOption — a selectable quiz answer tile (the core activity-slide control).
 * Feedback loop: default → selected → correct/incorrect. Rust = correct, error-red = incorrect.
 */
export const AnswerOption = ({
  label,
  marker,
  state = 'default',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}: AnswerOptionProps) => {
  const { theme } = useUnistyles();

  // 'default' is unistyles' reserved fallback key, selected by passing undefined.
  styles.useVariants({ state: state === 'default' ? undefined : state });

  const feedbackIcon =
    state === 'correct' ? 'check_circle' : state === 'incorrect' ? 'cancel' : null;
  const feedbackColor = state === 'correct' ? theme.colors.tertiary : theme.colors.error;
  const locked = disabled || state === 'correct' || state === 'incorrect';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${marker} ${label}`}
      accessibilityState={{ disabled: locked, selected: state === 'selected' }}
      disabled={locked}
      onPress={onPress}
      style={[styles.root, style]}
    >
      <View style={styles.marker}>
        <Text style={styles.markerText}>{marker}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      {feedbackIcon ? (
        <Icon name={feedbackIcon} size={theme.layout.iconSize} fill color={feedbackColor} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: theme.spacing.s4,
    paddingVertical: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.shape.md,
    variants: {
      state: {
        default: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        },
        selected: {
          backgroundColor: theme.colors.primaryContainer,
          borderWidth: 2,
          borderColor: theme.colors.primary,
        },
        correct: {
          backgroundColor: theme.utils.mixHex(
            theme.colors.tertiaryContainer,
            theme.colors.surface,
            0.55,
          ),
          borderWidth: 2,
          borderColor: theme.colors.tertiary,
        },
        incorrect: {
          backgroundColor: theme.colors.errorContainer,
          borderWidth: 2,
          borderColor: theme.colors.error,
        },
      },
    },
  },
  marker: {
    width: theme.spacing.s8,
    height: theme.spacing.s8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.full,
    variants: {
      state: {
        default: { backgroundColor: theme.colors.surfaceContainerHighest },
        selected: { backgroundColor: theme.colors.primary },
        correct: { backgroundColor: theme.colors.tertiary },
        incorrect: { backgroundColor: theme.colors.error },
      },
    },
  },
  markerText: {
    fontFamily: theme.fontFamily.brand,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.typography.titleSmall.fontSize,
    variants: {
      state: {
        default: { color: theme.colors.onSurfaceVariant },
        selected: { color: theme.colors.onPrimary },
        correct: { color: theme.colors.onTertiaryContainer },
        incorrect: { color: theme.colors.onError },
      },
    },
  },
  label: {
    ...theme.typography.bodyLarge,
    flex: 1,
    variants: {
      state: {
        default: { color: theme.colors.onSurface },
        selected: { color: theme.colors.onPrimaryContainer },
        correct: { color: theme.colors.onTertiaryContainer },
        incorrect: { color: theme.colors.onErrorContainer },
      },
    },
  },
}));
