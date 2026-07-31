import type { Lesson } from '@helsoft/types';
import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { expect, userEvent } from 'storybook/test';

import { configureLessonAttemptMock } from '../../../.storybook/mocks/hooks';
import { LessonPlayer } from './lesson-player';

// Seeds the fake useLessonAttempt() (see .storybook/mocks/hooks.ts) just before the story
// mounts — mirrors lesson-results.stories.tsx / components LessonPlayer stories.
const withLessonAttemptMock =
  (config: Parameters<typeof configureLessonAttemptMock>[0]): Decorator =>
  (StoryFn) => {
    configureLessonAttemptMock(config);
    return <StoryFn />;
  };

const lesson: Lesson = {
  id: 'lesson-1',
  userId: 'user-1',
  title: 'Capitals',
  createdAt: '2026-07-12T12:00:00.000Z',
  slides: [
    {
      id: 's1',
      lessonId: 'lesson-1',
      title: 'Welcome',
      content: 'This lesson covers European capitals.',
      position: 0,
      kind: 'instructional',
    },
    {
      id: 's2',
      lessonId: 'lesson-1',
      title: 'France',
      content: 'What is the capital of France?',
      position: 1,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [
        { id: 'a', label: 'Paris' },
        { id: 'b', label: 'Lyon' },
        { id: 'c', label: 'Marseille' },
      ],
      correctOptionId: 'a',
    },
  ],
};

const meta = {
  title: 'Features/LessonPlayer',
  component: LessonPlayer,
  decorators: [
    withLessonAttemptMock({ status: 'idle' }),
    (Story) => (
      <View style={{ width: 400, height: 640, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  args: {
    lesson,
    onBackToLessons: () => {},
  },
} satisfies Meta<typeof LessonPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstSlide: Story = {};

/** Mid-deck — advance to the France activity. */
export const MidDeck: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('France')).toBeTruthy();
    await expect(canvas.getByText('Slide 2 of 3')).toBeTruthy();
  },
};

/** Slideless lesson → Empty + Back. */
export const Empty: Story = {
  args: {
    lesson: { ...lesson, slides: [] },
  },
};

/** Load failure → Error + Retry + Back. */
export const ErrorState: Story = {
  args: {
    lesson: null,
    error: 'network_error',
    onRetry: () => {},
  },
};
