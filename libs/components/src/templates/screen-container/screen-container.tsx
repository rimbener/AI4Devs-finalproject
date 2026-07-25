import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import type { ScreenContainerProps } from './screen-container.types';

const ALL_EDGES = ['top', 'right', 'bottom', 'left'] as const;

export const ScreenContainer = ({
  children,
  style,
  edges = ALL_EDGES,
  ...rest
}: ScreenContainerProps) => {
  // SafeAreaView reads padding/margin off its own `style` prop (via StyleSheet.flatten) to
  // merge in safe-area insets, so it can't receive a StyleSheet.create value here — only
  // useUnistyles' plain, real theme value, with no padding/margin keys for it to clobber.
  // Theme-driven padding lives on the inner View instead.
  const { theme } = useUnistyles();

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      {...rest}
    >
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.spacing.s4,
  },
}));
