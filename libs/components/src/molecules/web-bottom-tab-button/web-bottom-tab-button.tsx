import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Icon } from '../../atoms/icon/icon';
import type { WebBottomTabButtonProps } from './web-bottom-tab-button.types';

/**
 * MD3-style navigation-bar item for narrow web: icon + label, with a pill
 * indicator behind the icon when focused (matches Android NativeTabs chrome).
 */
export const WebBottomTabButton = ({
  icon,
  label,
  isFocused = false,
  ref,
  ...pressableProps
}: WebBottomTabButtonProps) => (
  <Pressable
    {...pressableProps}
    accessibilityRole="tab"
    accessibilityState={{ selected: isFocused }}
    ref={ref}
    style={styles.tab}
    testID={`web-tab-${icon}`}
  >
    <View style={[styles.iconPill, isFocused && styles.iconPillFocused]}>
      <Icon fill={isFocused} name={icon} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create((theme) => ({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s1,
    minHeight: theme.layout.touchTarget,
    paddingVertical: theme.spacing.s2,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s1,
    borderRadius: theme.shape.full,
  },
  iconPillFocused: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  icon: {
    color: theme.colors.onSurfaceVariant,
  },
  label: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
}));
