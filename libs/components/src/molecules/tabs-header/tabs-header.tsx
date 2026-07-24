import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { TabsHeaderProps } from './tabs-header.types';

/**
 * TabsHeader — tab-screen title row with optional trailing action.
 * Presentational: caller supplies localized `title` and any CTA as children.
 */
export const TabsHeader = ({ title, children }: TabsHeaderProps) => (
  <View style={styles.header}>
    <Text accessibilityRole="header" style={styles.heading}>
      {title}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  heading: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onSurface,
    flexShrink: 1,
  },
}));
