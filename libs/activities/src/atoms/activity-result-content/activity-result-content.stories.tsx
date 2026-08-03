import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ActivityResultContent } from './activity-result-content';

const meta = {
  title: 'Atoms/ActivityResultContent',
  component: ActivityResultContent,
  args: {
    isCorrect: true,
  },
} satisfies Meta<typeof ActivityResultContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Correct banner, no summary or explanation. */
export const Correct: Story = {};

/** Incorrect banner. */
export const Incorrect: Story = {
  args: { isCorrect: false },
};

/** Correct banner with a score summary. */
export const WithSummary: Story = {
  args: { summary: '3 of 3 correct' },
};

/** Correct banner with a collapsible explanation. */
export const CorrectWithExplanation: Story = {
  args: { explanation: 'Paris is the capital of France.' },
};

/** Full result — click the top-right toggle to collapse/expand the explanation. */
export const IncorrectWithExplanation: Story = {
  args: {
    isCorrect: false,
    summary: '1 of 3 correct',
    explanation: 'Paris is the capital of France.',
  },
};
