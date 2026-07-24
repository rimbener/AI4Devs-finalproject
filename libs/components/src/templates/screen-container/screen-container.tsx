import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import type { ScreenContainerProps } from './screen-container.types';

const ALL_EDGES = ['top', 'right', 'bottom', 'left'] as const;

export const ScreenContainer = ({
  children,
  style,
  edges = ALL_EDGES,
  ...rest
}: ScreenContainerProps) => (
  <SafeAreaView edges={edges} style={[styles.container, style]} {...rest}>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.spacing.s4,
    backgroundColor: theme.colors.background,
  },
}));
