import type { OpenEndedSlide } from '@helsoft/types';
import { act, renderHook } from '@testing-library/react-native';

import { OPEN_ENDED_MAX_LENGTH } from './open-ended-activity.helpers';
import { useOpenEndedActivity } from './use-open-ended-activity';

const slide: OpenEndedSlide = {
  id: 'slide-oe-1',
  lessonId: 'lesson-1',
  title: 'Explain',
  content: 'What is photosynthesis?',
  position: 0,
  kind: 'activity',
  activityType: 'open-ended',
  modelAnswer: 'Conversion of light energy into chemical energy.',
  explanation: 'Key process in plants.',
};

describe('useOpenEndedActivity', () => {
  it('exposes maxLength from OPEN_ENDED_MAX_LENGTH', async () => {
    const { result } = await renderHook(() => useOpenEndedActivity({ slide }));

    expect(result.current.maxLength).toBe(OPEN_ENDED_MAX_LENGTH);
  });

  it.each([
    ['content', { content: '' }],
    ['content', { content: '   ' }],
    ['modelAnswer', { modelAnswer: '' }],
    ['modelAnswer', { modelAnswer: '\t\n' }],
  ] as const)('valid is false when %s is empty or whitespace-only', async (_field, patch) => {
    const { result } = await renderHook(() =>
      useOpenEndedActivity({ slide: { ...slide, ...patch } }),
    );

    expect(result.current.valid).toBe(false);
  });

  it('valid is true when both content and modelAnswer are non-empty', async () => {
    const { result } = await renderHook(() => useOpenEndedActivity({ slide }));

    expect(result.current.valid).toBe(true);
  });

  it('submit emits an OpenEndedAnswer with the submitted text and no isCorrect field', async () => {
    const onAnswered = jest.fn();
    const { result } = await renderHook(() => useOpenEndedActivity({ slide, onAnswered }));

    await act(async () => {
      result.current.submit('plants convert light');
    });

    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith({
      slideId: 'slide-oe-1',
      activityType: 'open-ended',
      submittedAnswer: 'plants convert light',
    });
    expect(onAnswered.mock.calls[0][0]).not.toHaveProperty('isCorrect');
  });

  it('does not emit onAnswered again after a second submit', async () => {
    const onAnswered = jest.fn();
    const { result } = await renderHook(() => useOpenEndedActivity({ slide, onAnswered }));

    await act(async () => {
      result.current.submit('first');
    });
    await act(async () => {
      result.current.submit('second');
    });

    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(onAnswered).toHaveBeenCalledWith({
      slideId: 'slide-oe-1',
      activityType: 'open-ended',
      submittedAnswer: 'first',
    });
  });

  it('does not emit onAnswered when the slide is invalid', async () => {
    const onAnswered = jest.fn();
    const { result } = await renderHook(() =>
      useOpenEndedActivity({ slide: { ...slide, content: '' }, onAnswered }),
    );

    await act(async () => {
      result.current.submit('anything');
    });

    expect(onAnswered).not.toHaveBeenCalled();
  });

  it('does not submit when an initialAnswer already marks the slide as answered', async () => {
    const onAnswered = jest.fn();
    const { result } = await renderHook(() =>
      useOpenEndedActivity({
        slide,
        onAnswered,
        initialAnswer: {
          slideId: slide.id,
          activityType: 'open-ended',
          submittedAnswer: 'prior essay',
        },
      }),
    );

    await act(async () => {
      result.current.submit('new attempt');
    });

    expect(onAnswered).not.toHaveBeenCalled();
  });

  it('does not throw when onAnswered is omitted', async () => {
    const { result } = await renderHook(() => useOpenEndedActivity({ slide }));

    await expect(
      act(async () => {
        result.current.submit('solo');
      }),
    ).resolves.not.toThrow();
  });

  it('emits an empty submittedAnswer when submit is called with an empty string', async () => {
    const onAnswered = jest.fn();
    const { result } = await renderHook(() => useOpenEndedActivity({ slide, onAnswered }));

    await act(async () => {
      result.current.submit('');
    });

    expect(onAnswered).toHaveBeenCalledWith({
      slideId: 'slide-oe-1',
      activityType: 'open-ended',
      submittedAnswer: '',
    });
  });
});
