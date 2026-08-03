import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { ActivityResultContent } from '../../atoms/activity-result-content/activity-result-content';
import { ActivityResultPanel } from './activity-result-panel';

const meta = {
  title: 'Molecules/ActivityResultPanel',
  component: ActivityResultPanel,
  args: {
    canSubmit: false,
    hasResult: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof ActivityResultPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty state — activity incomplete, no result yet. */
export const Hidden: Story = {};

/** Content state — activity complete, submit button visible (slides up from the bottom). */
export const ReadyToSubmit: Story = {
  // ai-result-panel-frontend task-1, @s1 ReadyToSubmit
  args: { canSubmit: true },
};

/** Result state — children render in place of the submit button. */
export const Result: Story = {
  args: {
    canSubmit: true,
    hasResult: true,
    children: (
      <ActivityResultContent
        isCorrect
        summary="3 of 3 correct"
        explanation="Capitals match their countries."
      />
    ),
  },
};

/** Interactive — submitting swaps the button for the result content. */
export const Interactive: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState(false);

    return (
      <ActivityResultPanel
        canSubmit
        hasResult={submitted}
        onSubmit={() => setSubmitted(true)}
        resultTestID="result-test"
      >
        {submitted ? (
          <ActivityResultContent
            isCorrect
            summary="3 of 3 correct"
            explanation="Capitals match their countries."
          />
        ) : null}
      </ActivityResultPanel>
    );
  },
};
