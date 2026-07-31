import type { InstructionalSlide, MultipleChoiceSlide } from '@helsoft/types';

import { isInstructional } from './slide-view.helpers';

const instructionalSlide: InstructionalSlide = {
  id: 'slide-1',
  lessonId: 'lesson-1',
  title: 'Intro',
  content: 'Welcome to the lesson.',
  position: 0,
  kind: 'instructional',
};

const activitySlide: MultipleChoiceSlide = {
  id: 'slide-2',
  lessonId: 'lesson-1',
  title: 'Quiz',
  content: 'What is the capital of France?',
  position: 1,
  kind: 'activity',
  activityType: 'multiple-choice',
  options: [
    { id: 'opt-1', label: 'Paris' },
    { id: 'opt-2', label: 'Lyon' },
  ],
  correctOptionId: 'opt-1',
};

describe('isInstructional', () => {
  it('returns true for an instructional slide', () => {
    expect(isInstructional(instructionalSlide)).toBe(true);
  });

  it('returns false for an activity slide', () => {
    expect(isInstructional(activitySlide)).toBe(false);
  });
});
