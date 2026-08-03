import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ActivityResultExplanation } from './activity-result-explanation';

const meta = {
  title: 'Atoms/ActivityResultExplanation',
  component: ActivityResultExplanation,
  args: {
    testID: 'activity-result-explanation',
    heading: 'Explanation',
    body: 'Paris is the capital of France.',
  },
} satisfies Meta<typeof ActivityResultExplanation>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Heading and body. */
export const Default: Story = {};

/** Body only — heading is optional. */
export const WithoutHeading: Story = {
  args: { heading: undefined },
};

/** Heading only — body is optional. */
export const WithoutBody: Story = {
  args: { body: undefined },
};
