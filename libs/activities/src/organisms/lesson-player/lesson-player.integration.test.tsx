jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));
// No image on the slides — a null URL keeps react-query (and its timers) out of the test.
jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useSlideImageUrl: () => ({ url: undefined }),
}));

import { ACTIVITY_FOOTER_NEXT_TEST_ID } from '@helsoft/activities/test-ids';
import type { Lesson } from '@helsoft/types';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { LESSON_PLAYER_BODY_TEST_ID, LessonPlayer } from './lesson-player';

jest.mock('../slide-view/use-slide-layout', () => ({
  useSlideLayout: jest.fn(() => ({ isSplit: false })),
}));

import { useSlideLayout } from '../slide-view/use-slide-layout';

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
      content: 'Let us begin.',
      position: 0,
      kind: 'instructional',
    },
    {
      id: 's2',
      lessonId: 'lesson-1',
      title: 'Capital?',
      content: 'Capital?',
      position: 1,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [
        { id: 'a', label: 'Paris' },
        { id: 'b', label: 'Berlin' },
      ],
      correctOptionId: 'a',
      explanation: 'Paris has been the capital since the 12th century.',
    },
    {
      id: 's3',
      lessonId: 'lesson-1',
      title: 'Another?',
      content: 'Another?',
      position: 2,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [
        { id: 'a', label: 'Madrid' },
        { id: 'b', label: 'Berlin' },
      ],
      correctOptionId: 'a',
    },
  ],
};

// Entrance animation drives a native requestAnimationFrame loop that keeps Jest
// alive after the run; the animation itself is unit-tested separately.
beforeEach(() => {
  jest.spyOn(Animated, 'timing').mockReturnValue({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  } as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const pressNext = async () => {
  await act(async () => {
    fireEvent.press(screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID));
  });
};

const selectAndSubmit = async (optionLabel: string) => {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: new RegExp(optionLabel) }));
  });
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'activity.result.submit' }));
  });
};

describe('LessonPlayer pinned footer integration', () => {
  it('shows the Next button immediately on an instructional slide', async () => {
    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />);

    expect(screen.getByText('Let us begin.')).toBeTruthy();
    expect(screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeTruthy();

    await pressNext();

    // Advances to the activity slide, which hides Next until it is answered.
    expect(screen.getByRole('button', { name: /Paris/ })).toBeTruthy();
    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();
  });

  it('pins the submit button below the body scroll and swaps it for the result', async () => {
    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />);
    await pressNext(); // s1 → s2 (MCQ)

    const bodyScroll = screen.getByTestId(LESSON_PLAYER_BODY_TEST_ID);

    expect(screen.queryByRole('button', { name: 'activity.result.submit' })).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Paris/ }));
    });

    const submit = screen.getByRole('button', { name: 'activity.result.submit' });
    expect(within(bodyScroll).queryByRole('button', { name: 'activity.result.submit' })).toBeNull();

    await act(async () => {
      fireEvent.press(submit);
    });

    expect(screen.getByText('activity.result.correct')).toBeTruthy();
    expect(within(bodyScroll).queryByText('activity.result.correct')).toBeNull();
    expect(screen.queryByRole('button', { name: 'activity.result.submit' })).toBeNull();
  });

  it('hides the Next button until the activity is answered, then shows it with the result', async () => {
    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />);
    await pressNext(); // s1 → s2 (MCQ)

    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();

    await selectAndSubmit('Paris');

    expect(screen.getByText('activity.result.correct')).toBeTruthy();
    expect(screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeTruthy();
  });

  it('collapses and expands the pinned results panel', async () => {
    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />);
    await pressNext();
    await selectAndSubmit('Paris');
    expect(screen.getByText('activity.result.correct')).toBeTruthy();
    expect(screen.getByText('Paris has been the capital since the 12th century.')).toBeTruthy();

    const toggle = screen.getByTestId('activity-footer-collapse');
    await act(async () => {
      fireEvent.press(toggle);
    });
    expect(screen.queryByText('Paris has been the capital since the 12th century.')).toBeNull();

    await act(async () => {
      fireEvent.press(toggle);
    });
    expect(screen.getByText('Paris has been the capital since the 12th century.')).toBeTruthy();
  });

  it('advances to the next slide via the pinned Next button', async () => {
    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />);
    await pressNext();
    await selectAndSubmit('Paris');
    expect(screen.getByText('activity.result.correct')).toBeTruthy();

    await pressNext();

    // Slide 3 is now active; the new unanswered activity hides Next again.
    expect(screen.getByRole('button', { name: /Madrid/ })).toBeTruthy();
    expect(screen.queryByText('activity.result.correct')).toBeNull();
    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();
  });

  // Nested provider regression: a split slide's body pane is a plain ScrollView, NOT a
  // footer host. The activity footer must register on the outer LessonPlayer provider so
  // submit/result pin at the deck level and Next hides until answered — instead of pinning
  // inside the split pane with the outer Next still visible.
  it('pins the footer to the deck provider and hides Next on a split slide', async () => {
    jest.mocked(useSlideLayout).mockReturnValue({ isSplit: true });

    const splitLesson: Lesson = {
      ...lesson,
      slides: [
        {
          ...lesson.slides[1],
          title: 'Split Capital?',
          image: { imageId: 'img-1', storagePath: 'slides/img-1.png', width: 800, height: 600 },
        },
      ],
    };

    await render(<LessonPlayer lesson={splitLesson} onBackToLessons={jest.fn()} />);

    // Split layout forces the split body pane; the footer must NOT live inside it.
    expect(screen.getByTestId('slide-split-row')).toBeTruthy();
    expect(screen.getByTestId('slide-body-scroll')).toBeTruthy();
    expect(screen.getByTestId(LESSON_PLAYER_BODY_TEST_ID)).toBeTruthy();

    // No activity footer yet and no Next until answered.
    expect(screen.queryByRole('button', { name: 'activity.result.submit' })).toBeNull();
    expect(screen.queryByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /Paris/ }));
    });

    // Submit pins below the deck body scroll (outer provider), not inside the split pane.
    const submit = screen.getByRole('button', { name: 'activity.result.submit' });
    expect(
      within(screen.getByTestId('slide-body-scroll')).queryByRole('button', {
        name: 'activity.result.submit',
      }),
    ).toBeNull();

    await act(async () => {
      fireEvent.press(submit);
    });

    expect(screen.getByText('activity.result.correct')).toBeTruthy();
    expect(
      within(screen.getByTestId('slide-body-scroll')).queryByText('activity.result.correct'),
    ).toBeNull();
    expect(screen.getByTestId(ACTIVITY_FOOTER_NEXT_TEST_ID)).toBeTruthy();
  });
});
