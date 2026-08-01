import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ActivitySubmitResult } from './activity-submit-result';

const styles = StyleSheet.create((theme) => ({
  banner: {
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
    backgroundColor: theme.colors.tertiaryContainer,
  },
  bannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onTertiaryContainer,
  },
}));

const meta = {
  title: 'Molecules/ActivitySubmitResult',
  component: ActivitySubmitResult,
  args: {
    submitLabel: 'Submit',
    canSubmit: false,
    hasResult: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof ActivitySubmitResult>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty state — activity incomplete, no result yet. */
export const Hidden: Story = {};

/** Content state — activity complete, submit button visible (slides up from the bottom). */
export const ReadyToSubmit: Story = {
  args: { canSubmit: true },
};

/** Result state — children render in place of the submit button. */
export const Result: Story = {
  args: {
    canSubmit: true,
    hasResult: true,
    children: (
      <View accessibilityRole="alert" style={styles.banner}>
        <Text style={styles.bannerText}>All correct!</Text>
      </View>
    ),
  },
};

/** Interactive — submitting swaps the button for the result content. */
export const Interactive: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <ActivitySubmitResult
        submitLabel="Submit"
        canSubmit
        hasResult={submitted}
        onSubmit={() => setSubmitted(true)}
        resultTestID="activity-submit-result-result"
      >
        {submitted ? (
          <View accessibilityRole="alert" style={styles.banner}>
            <Text style={styles.bannerText}>All correct!</Text>
          </View>
        ) : null}
      </ActivitySubmitResult>
    );
  },
};
