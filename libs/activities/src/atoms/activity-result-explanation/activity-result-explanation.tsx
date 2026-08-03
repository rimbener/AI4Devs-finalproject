import { type StyleProp, Text, View, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type ActivityResultExplanationProps = {
  body?: string;
  testID: string;
  heading?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
};
export const ActivityResultExplanation = ({
  body,
  testID,
  heading,
  style,
  accessibilityLiveRegion,
}: ActivityResultExplanationProps) => {
  return (
    <View
      testID={testID}
      style={[styles.block, style]}
      accessibilityLiveRegion={accessibilityLiveRegion}
    >
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  block: {
    marginVertical: theme.spacing.s1,
    gap: theme.spacing.s1,
  },
  heading: {
    ...theme.typography.titleSmall,
    color: theme.colors.onSurfaceVariant,
  },
  body: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
}));
