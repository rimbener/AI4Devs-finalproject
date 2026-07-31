jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useLessonAttempt: jest.fn(),
}));

import { useLessonAttempt } from '@helsoft/hooks';
import type { GradedAnswer, Lesson } from '@helsoft/types';
import { act, renderHook } from '@testing-library/react-native';

import { useLessonResults } from './use-lesson-results';

const mockUseLessonAttempt = useLessonAttempt as jest.Mock;

const lessonAttemptValue = (overrides: Partial<ReturnType<typeof useLessonAttempt>> = {}) => ({
  status: 'idle' as const,
  attempt: null,
  saveAttempt: jest.fn(),
  retry: jest.fn(),
  ...overrides,
});

const scorableLesson: Lesson = {
  id: 'lesson-1',
  userId: 'user-1',
  title: 'Capitals',
  createdAt: '2026-07-11T00:00:00.000Z',
  slides: [
    {
      id: 'slide-1',
      lessonId: 'lesson-1',
      title: 'Q1',
      content: 'What is the capital of France?',
      position: 0,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [{ id: 'opt-a', label: 'Paris' }],
      correctOptionId: 'opt-a',
    },
    {
      id: 'slide-2',
      lessonId: 'lesson-1',
      title: 'Q2',
      content: 'What is the capital of Germany?',
      position: 1,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [{ id: 'opt-a', label: 'Berlin' }],
      correctOptionId: 'opt-a',
    },
  ],
};

const scorableAnswers: GradedAnswer[] = [
  { slideId: 'slide-1', activityType: 'multiple-choice', isCorrect: true },
  { slideId: 'slide-2', activityType: 'multiple-choice', isCorrect: false },
];

const completionLesson: Lesson = {
  id: 'lesson-2',
  userId: 'user-1',
  title: 'Intro',
  createdAt: '2026-07-11T00:00:00.000Z',
  slides: [
    {
      id: 'slide-1',
      lessonId: 'lesson-2',
      title: 'Intro slide',
      content: 'Welcome.',
      position: 0,
      kind: 'instructional',
    },
  ],
};

describe('useLessonResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue());
  });

  it('returns the score variant with correct/total when the lesson has scorable slides', async () => {
    const { result } = await renderHook(() =>
      useLessonResults({ lesson: scorableLesson, answers: scorableAnswers }),
    );

    expect(result.current.variant).toBe('score');
    expect(result.current.correct).toBe(1);
    expect(result.current.total).toBe(2);
  });

  it('returns the completion variant when the lesson has no system-checked slides', async () => {
    const { result } = await renderHook(() =>
      useLessonResults({ lesson: completionLesson, answers: [] }),
    );

    expect(result.current.variant).toBe('completion');
  });

  it('calls saveAttempt on mount by default when the lesson is scorable', async () => {
    const saveAttempt = jest.fn();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ saveAttempt }));

    await renderHook(() => useLessonResults({ lesson: scorableLesson, answers: scorableAnswers }));

    expect(saveAttempt).toHaveBeenCalledTimes(1);
    expect(saveAttempt).toHaveBeenCalledWith({ lessonId: 'lesson-1', score: 1, total: 2 });
  });

  it('does not call saveAttempt when persistOnMount is false', async () => {
    const saveAttempt = jest.fn();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ saveAttempt }));

    await renderHook(() =>
      useLessonResults({
        lesson: scorableLesson,
        answers: scorableAnswers,
        persistOnMount: false,
      }),
    );

    expect(saveAttempt).not.toHaveBeenCalled();
  });

  it('does not call saveAttempt when the lesson is not scorable, even with persistOnMount true', async () => {
    const saveAttempt = jest.fn();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ saveAttempt }));

    await renderHook(() =>
      useLessonResults({ lesson: completionLesson, answers: [], persistOnMount: true }),
    );

    expect(saveAttempt).not.toHaveBeenCalled();
  });

  it('only saves once even if the hook re-renders with the same lesson/answers', async () => {
    const saveAttempt = jest.fn();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ saveAttempt }));

    const { rerender } = await renderHook(
      (props: { lesson: Lesson; answers: GradedAnswer[] }) => useLessonResults(props),
      { initialProps: { lesson: scorableLesson, answers: scorableAnswers } },
    );
    expect(saveAttempt).toHaveBeenCalledTimes(1);

    await rerender({ lesson: scorableLesson, answers: scorableAnswers });

    expect(saveAttempt).toHaveBeenCalledTimes(1);
  });

  it('maps status to loading/saveFailed flags', async () => {
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ status: 'saving' }));
    const { result: savingResult } = await renderHook(() =>
      useLessonResults({ lesson: scorableLesson, answers: scorableAnswers }),
    );
    expect(savingResult.current.loading).toBe(true);
    expect(savingResult.current.saveFailed).toBe(false);

    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ status: 'error' }));
    const { result: errorResult } = await renderHook(() =>
      useLessonResults({ lesson: scorableLesson, answers: scorableAnswers }),
    );
    expect(errorResult.current.loading).toBe(false);
    expect(errorResult.current.saveFailed).toBe(true);
  });

  it('exposes the underlying retry as onRetrySave', async () => {
    const retry = jest.fn();
    mockUseLessonAttempt.mockReturnValue(lessonAttemptValue({ retry }));

    const { result } = await renderHook(() =>
      useLessonResults({ lesson: scorableLesson, answers: scorableAnswers }),
    );

    await act(async () => {
      result.current.onRetrySave();
    });

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
