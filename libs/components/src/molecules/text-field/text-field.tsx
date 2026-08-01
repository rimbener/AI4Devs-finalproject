import { useState } from 'react';
import {
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Icon } from '../../atoms/icon/icon';

export type TextFieldVariant = 'filled' | 'outlined';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  ref?: React.RefObject<TextInput | null>;
  label?: string;
  variant?: TextFieldVariant;
  supportingText?: string;
  error?: boolean;
  /** Material Symbols icon names. */
  leadingIcon?: string;
  trailingIcon?: string;
  disabled?: boolean;
  /** Visible lines when multiline. */
  rows?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Forwarded onto the underlying TextInput. Not yet declared on this RN version's
   * `TextInputProps`, but react-native-web's `createDOMProps` forwards it to `aria-invalid` —
   * unlike `accessibilityHint`, which react-native-web does not forward at all (Full-review
   * Round 1, Major 3). Defaults to `error` (Full-review Round 2) — TextField already owns the
   * visual error state, so it derives its own a11y-invalid signal instead of requiring every
   * consumer to pass both in lockstep. Still overridable for the rare case a caller wants to
   * decouple the two.
   */
  accessibilityInvalid?: boolean;
};

/**
 * TextField — MD3 text input. variant: filled | outlined.
 * Supports label, supporting text, leading/trailing icons, error state, multiline.
 */
export const TextField = ({
  ref,
  label,
  variant = 'filled',
  supportingText,
  error = false,
  leadingIcon,
  trailingIcon,
  disabled = false,
  multiline = false,
  rows = 3,
  fullWidth = true,
  style,
  onFocus,
  onBlur,
  accessibilityInvalid = error,
  ...rest
}: TextFieldProps) => {
  const { theme } = useUnistyles();
  const [focus, setFocus] = useState(false);

  styles.useVariants({ variant });
  const accent = error
    ? theme.colors.error
    : focus
      ? theme.colors.primary
      : theme.colors.onSurfaceVariant;
  const borderColor = error
    ? theme.colors.error
    : focus
      ? theme.colors.primary
      : theme.colors.outline;
  // Not on this RN version's TextInputProps typings (see the prop's own doc comment above), so it
  // has to be merged into `rest` here rather than passed as a named JSX attribute.
  const inputProps = { ...rest, accessibilityInvalid };

  return (
    <View style={[styles.root(fullWidth), style]}>
      {label ? <Text style={styles.label(error)}>{label}</Text> : null}
      <View style={styles.field(accent, borderColor, focus, !!multiline, disabled)}>
        {leadingIcon ? (
          <Icon
            name={leadingIcon}
            size={theme.spacing.s5}
            color={theme.colors.onSurfaceVariant}
            style={multiline ? styles.multilineIcon : undefined}
          />
        ) : null}
        <TextInput
          ref={ref}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? rows : 1}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={styles.input(!!multiline, rows, borderColor)}
          {...inputProps}
        />
        {trailingIcon ? (
          <Icon
            name={trailingIcon}
            size={theme.spacing.s5}
            color={accent}
            style={multiline ? styles.multilineIcon : undefined}
          />
        ) : null}
      </View>
      {supportingText ? <Text style={styles.supporting(error)}>{supportingText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: (fullWidth: boolean) => ({
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  }),
  label: (error: boolean) => ({
    ...theme.typography.bodySmall,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.s2,
    color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
  }),
  field: (
    accent: string,
    borderColor: string,
    focus: boolean,
    multiline: boolean,
    disabled: boolean,
  ) => ({
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    gap: theme.spacing.s3,
    minHeight: theme.spacing.s14,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: multiline ? theme.spacing.s4 : theme.spacing.s0,
    opacity: disabled ? theme.disabledOpacity : 1,
    variants: {
      variant: {
        // MD3 focus indicator is a 2px border (WCAG 2.4.7); the negative margin absorbs the
        // extra pixel so focusing never shifts layout (the jitter that got 2px removed before).
        filled: {
          backgroundColor: theme.colors.surfaceContainerHighest,
          borderBottomWidth: focus ? 2 : 1,
          marginBottom: focus ? -1 : 0,
          borderBottomColor: accent,
          borderTopLeftRadius: theme.shape.textField,
          borderTopRightRadius: theme.shape.textField,
        },
        outlined: {
          backgroundColor: 'transparent',
          borderWidth: focus ? 2 : 1,
          margin: focus ? -1 : 0,
          borderColor,
          borderRadius: theme.shape.xs,
        },
      },
    },
  }),
  input: (multiline: boolean, rows: number, borderColor: string) => ({
    ...theme.typography.bodyLarge,
    flex: 1,
    color: theme.colors.onSurface,
    paddingVertical: multiline ? theme.spacing.s0 : theme.spacing.s4,
    minHeight: multiline ? rows * theme.spacing.s6 : undefined,
    textAlignVertical: multiline ? 'top' : 'center',
    outlineStyle: 'solid',
    outlineWidth: 0,
    outlineColor: borderColor,
  }),
  multilineIcon: {
    marginTop: theme.spacing.s1 / 2,
  },
  supporting: (error: boolean) => ({
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.s1,
    paddingHorizontal: theme.spacing.s4,
    color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
  }),
}));
