import type {
  InstructionalSlide,
  Lesson,
  MultipleChoiceSlide,
  OpenEndedSlide,
} from '@helsoft/types';

import { toScorableSlides } from './lesson-results.helpers';

const instructionalSlide: InstructionalSlide = {
  id: 'slide-1',
  lessonId: 'lesson-1',
  title: 'Intro',
  content: 'Welcome to the lesson.',
  position: 0,
  kind: 'instructional',
};

const multipleChoiceSlide: MultipleChoiceSlide = {
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

const openEndedSlide: OpenEndedSlide = {
  id: 'slide-3',
  lessonId: 'lesson-1',
  title: 'Reflect',
  content: 'Describe the Eiffel Tower.',
  position: 2,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'A wrought-iron lattice tower in Paris.',
};

const lesson: Lesson = {
  id: 'lesson-1',
  userId: 'user-1',
  title: 'French Geography',
  createdAt: '2026-01-01T00:00:00.000Z',
  slides: [instructionalSlide, multipleChoiceSlide, openEndedSlide],
};

describe('toScorableSlides', () => {
  it('filters out instructional slides, keeping only activity slides', () => {
    expect(toScorableSlides(lesson)).toEqual([
      { id: 'slide-2', activityType: 'multiple-choice' },
      { id: 'slide-3', activityType: 'open-ended' },
    ]);
  });

  it('projects each activity slide down to just id + activityType', () => {
    const [projected] = toScorableSlides(lesson);

    expect(Object.keys(projected!)).toEqual(['id', 'activityType']);
  });

  it('returns an empty array for a lesson with no activity slides', () => {
    const instructionalOnly: Lesson = { ...lesson, slides: [instructionalSlide] };

    expect(toScorableSlides(instructionalOnly)).toEqual([]);
  });

  it('returns an empty array for a lesson with no slides', () => {
    expect(toScorableSlides({ ...lesson, slides: [] })).toEqual([]);
  });
});
