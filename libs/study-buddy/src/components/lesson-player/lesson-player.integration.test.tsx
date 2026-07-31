jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { RESULTS_LOADING_TEST_ID } from '@helsoft/components';
import { QueryProvider } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { SupabaseClient } from '@helsoft/supabase-services';
import { initSupabase } from '@helsoft/supabase-services';
import type { Lesson } from '@helsoft/types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { LessonPlayer } from './lesson-player';

const mockUseLocalization = useLocalization as jest.Mock;

// Mimics the real player.*/results.* i18next templates so rendered text proves the deck +
// scoring pipeline ran, not just that a component mounted.
const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'player.slideOf') return `Slide ${options?.current} of ${options?.total}`;
  if (key === 'player.next') return 'Next';
  if (key === 'player.back') return 'Back';
  if (key === 'player.empty.message') return 'No slides yet';
  if (key === 'player.error.message') return 'Could not load lesson';
  if (key === 'player.error.retry') return 'Retry';
  if (key === 'results.score') return `${options?.correct} / ${options?.total}`;
  if (key === 'results.scorePercent') return `${options?.percent}%`;
  if (key === 'results.retake') return 'Retake activities';
  if (key === 'results.backHome') return 'Back to my lessons';
  return key;
};

const lesson: Lesson = {
  id: 'lesson-1',
  userId: 'user-1',
  title: 'Capitals',
  createdAt: '2026-07-11T00:00:00.000Z',
  slides: [
    {
      id: 'slide-1',
      lessonId: 'lesson-1',
      title: 'Welcome',
      content: 'This lesson covers European capitals.',
      position: 0,
      kind: 'instructional',
    },
    {
      id: 'slide-2',
      lessonId: 'lesson-1',
      title: 'France',
      content: 'What is the capital of France?',
      position: 1,
      kind: 'activity',
      activityType: 'multiple-choice',
      options: [{ id: 'opt-a', label: 'Paris' }],
      correctOptionId: 'opt-a',
    },
  ],
};

/**
 * Integration: thin study-buddy LessonPlayer → activities organism deck → results slide →
 * useLessonAttempt → LessonAttemptService → LessonAttemptDao (mocked Supabase `.from()`).
 */
describe('LessonPlayer integration (study-buddy -> hook -> service -> DAO)', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = initSupabase({ url: 'https://example.supabase.co', anonKey: 'anon-key' });
  });

  beforeEach(() => {
    mockUseLocalization.mockReturnValue(localizationValue({ t }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reaches the results slide and persists the attempt via the real hook/service/DAO pipeline', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'attempt-1',
        lesson_id: 'lesson-1',
        score: 0,
        total: 1,
        created_at: '2026-07-11T00:00:00.000Z',
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    jest.spyOn(client, 'from').mockReturnValue({ insert } as never);

    await render(<LessonPlayer lesson={lesson} onBackToLessons={jest.fn()} />, {
      wrapper: QueryProvider,
    });

    expect(screen.getByText('Slide 1 of 3')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    });

    expect(screen.getByText('0 / 1')).toBeTruthy();
    await waitFor(() =>
      expect(insert).toHaveBeenCalledWith({ lesson_id: 'lesson-1', score: 0, total: 1 }),
    );
    await waitFor(() => expect(screen.queryByTestId(RESULTS_LOADING_TEST_ID)).toBeNull());
  });

  it('forwards onBackToLessons from the results slide', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'attempt-2',
        lesson_id: 'lesson-1',
        score: 0,
        total: 1,
        created_at: '2026-07-11T00:00:00.000Z',
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    jest.spyOn(client, 'from').mockReturnValue({ insert } as never);
    const onBackToLessons = jest.fn();

    await render(<LessonPlayer lesson={lesson} onBackToLessons={onBackToLessons} />, {
      wrapper: QueryProvider,
    });

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    });
    await waitFor(() => expect(insert).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId(RESULTS_LOADING_TEST_ID)).toBeNull());
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Back to my lessons' }));
    });

    expect(onBackToLessons).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state and calls onBackToLessons without touching Supabase', async () => {
    const onBackToLessons = jest.fn();
    const fromSpy = jest.spyOn(client, 'from');

    await render(
      <LessonPlayer lesson={{ ...lesson, slides: [] }} onBackToLessons={onBackToLessons} />,
      { wrapper: QueryProvider },
    );

    expect(screen.getByText('No slides yet')).toBeTruthy();
    expect(fromSpy).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    });
    expect(onBackToLessons).toHaveBeenCalledTimes(1);
  });

  it('shows the error state and invokes onRetry', async () => {
    const onRetry = jest.fn();

    await render(
      <LessonPlayer
        lesson={null}
        error="network_error"
        onRetry={onRetry}
        onBackToLessons={jest.fn()}
      />,
      { wrapper: QueryProvider },
    );

    expect(screen.getByText('Could not load lesson')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
