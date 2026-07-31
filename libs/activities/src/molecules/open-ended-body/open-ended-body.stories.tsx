import type { OpenEndedSlide } from '@helsoft/types';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OpenEndedBody } from './open-ended-body';

const slide: OpenEndedSlide = {
  id: 's1',
  lessonId: 'lesson-1',
  title: 'Explain',
  content: 'What is photosynthesis?',
  position: 0,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'Conversion of light energy into chemical energy.',
  explanation: 'Key process in plants.',
};

const meta = {
  title: 'Molecules/OpenEndedBody',
  component: OpenEndedBody,
  args: {
    slide,
    onAnswered: () => {},
  },
} satisfies Meta<typeof OpenEndedBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unanswered: Story = {};

export const Answered: Story = {
  args: {
    initialAnswer: {
      slideId: slide.id,
      activityType: 'open-ended',
      submittedAnswer: 'Plants turn light into sugar.',
    },
  },
};

export const WithoutExplanation: Story = {
  args: {
    slide: { ...slide, explanation: undefined },
  },
};

export const UnavailableMissingModelAnswer: Story = {
  args: {
    slide: { ...slide, modelAnswer: '   ' },
  },
};

export const Interactive: Story = {};
