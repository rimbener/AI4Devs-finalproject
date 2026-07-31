jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'activity.matching.summary' && opts) {
        return `${opts.correct} of ${opts.total} correct`;
      }
      return key;
    },
  }),
}));

import type { MatchingAnswer } from '@helsoft/types';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

import type { MatchingItemView, UseMatchingProps } from './matching.types';
import { useMatching } from './use-matching';

const leftItems: MatchingItemView[] = [
  { id: 'l1', label: 'France' },
  { id: 'l2', label: 'Germany' },
  { id: 'l3', label: 'Italy' },
];

const rightItems: MatchingItemView[] = [
  { id: 'r1', label: 'Paris' },
  { id: 'r2', label: 'Berlin' },
  { id: 'r3', label: 'Rome' },
];

const allCorrectAnswer: MatchingAnswer = {
  slideId: 'slide-1',
  activityType: 'matching',
  pairs: [
    { leftId: 'l1', rightId: 'r1', isCorrect: true },
    { leftId: 'l2', rightId: 'r2', isCorrect: true },
    { leftId: 'l3', rightId: 'r3', isCorrect: true },
  ],
  correctPairCount: 3,
  totalPairCount: 3,
  isCorrect: true,
};

const mixedAnswer: MatchingAnswer = {
  slideId: 'slide-1',
  activityType: 'matching',
  pairs: [
    { leftId: 'l1', rightId: 'r1', isCorrect: true },
    { leftId: 'l2', rightId: 'r3', isCorrect: false },
    { leftId: 'l3', rightId: 'r2', isCorrect: false },
  ],
  correctPairCount: 1,
  totalPairCount: 3,
  isCorrect: false,
};

const defaultProps: UseMatchingProps = {
  leftItems,
  rightItems,
};

describe('useMatching', () => {
  it('starts unsubmitted with null pending, unlocked', async () => {
    const { result } = await renderHook(() => useMatching(defaultProps));

    expect(result.current.pending).toBeNull();
    expect(result.current.formedPairs).toEqual([]);
    expect(result.current.answer).toBeNull();
    expect(result.current.locked).toBe(false);
    expect(result.current.allPaired).toBe(false);
    expect(result.current.isUnavailable).toBe(false);
  });

  it('seeds formedPairs from initialPairs and reports allPaired when lengths match', async () => {
    const initialPairs = [
      { leftId: 'l1', rightId: 'r1' },
      { leftId: 'l2', rightId: 'r2' },
      { leftId: 'l3', rightId: 'r3' },
    ];
    const { result } = await renderHook(() => useMatching({ ...defaultProps, initialPairs }));

    expect(result.current.formedPairs).toEqual(initialPairs);
    expect(result.current.allPaired).toBe(true);
  });

  it('locks when initialAnswer is set and isCorrect', async () => {
    const { result } = await renderHook(() =>
      useMatching({ ...defaultProps, initialAnswer: allCorrectAnswer }),
    );

    expect(result.current.locked).toBe(true);
    expect(result.current.answer).toEqual(allCorrectAnswer);
  });

  it('locks when initialAnswer is set and incorrect', async () => {
    const { result } = await renderHook(() =>
      useMatching({ ...defaultProps, initialAnswer: mixedAnswer }),
    );

    expect(result.current.locked).toBe(true);
  });

  it('marks unavailable when unavailable prop is true', async () => {
    const { result } = await renderHook(() => useMatching({ ...defaultProps, unavailable: true }));

    expect(result.current.isUnavailable).toBe(true);
  });

  it('marks unavailable when left column is empty', async () => {
    const { result } = await renderHook(() =>
      useMatching({ ...defaultProps, leftItems: [], rightItems }),
    );

    expect(result.current.isUnavailable).toBe(true);
  });

  it('marks unavailable when both columns are empty', async () => {
    const { result } = await renderHook(() =>
      useMatching({ ...defaultProps, leftItems: [], rightItems: [] }),
    );

    expect(result.current.isUnavailable).toBe(true);
  });

  it('marks unavailable when column lengths differ', async () => {
    const { result } = await renderHook(() =>
      useMatching({
        ...defaultProps,
        rightItems: [{ id: 'r1', label: 'Paris' }],
      }),
    );

    expect(result.current.isUnavailable).toBe(true);
  });

  describe('itemState', () => {
    it('returns pending for the pending selection only', async () => {
      const { result } = await renderHook(() => useMatching(defaultProps));

      await act(() => {
        result.current.dispatch({ type: 'item/press', column: 'left', id: 'l1' });
      });

      expect(result.current.itemState('left', 'l1')).toBe('pending');
      expect(result.current.itemState('left', 'l2')).toBeUndefined();
      expect(result.current.itemState('right', 'l1')).toBeUndefined();
    });

    it('returns paired for items in formedPairs while unsubmitted', async () => {
      const { result } = await renderHook(() => useMatching(defaultProps));

      await act(() => {
        result.current.dispatch({ type: 'item/press', column: 'left', id: 'l1' });
        result.current.dispatch({ type: 'item/press', column: 'right', id: 'r1' });
      });

      expect(result.current.itemState('left', 'l1')).toBe('paired');
      expect(result.current.itemState('right', 'r1')).toBe('paired');
      expect(result.current.itemState('left', 'l2')).toBeUndefined();
      expect(result.current.allPaired).toBe(false);
    });

    it('returns correct/incorrect from graded pairs and ignores pending/formedPairs', async () => {
      const { result } = await renderHook(() =>
        useMatching({
          ...defaultProps,
          initialPairs: [{ leftId: 'l1', rightId: 'r1' }],
          initialAnswer: mixedAnswer,
        }),
      );

      await act(() => {
        result.current.dispatch({ type: 'item/press', column: 'left', id: 'l2' });
      });

      expect(result.current.itemState('left', 'l1')).toBe('correct');
      expect(result.current.itemState('right', 'r1')).toBe('correct');
      expect(result.current.itemState('left', 'l2')).toBe('incorrect');
      expect(result.current.itemState('right', 'r3')).toBe('incorrect');
      expect(result.current.itemState('left', 'l2')).not.toBe('pending');
    });

    it('returns undefined for items absent from answer.pairs', async () => {
      const partialAnswer: MatchingAnswer = {
        slideId: 'slide-1',
        activityType: 'matching',
        pairs: [{ leftId: 'l1', rightId: 'r1', isCorrect: true }],
        correctPairCount: 1,
        totalPairCount: 3,
        isCorrect: false,
      };
      const { result } = await renderHook(() =>
        useMatching({ ...defaultProps, initialAnswer: partialAnswer }),
      );

      expect(result.current.itemState('left', 'l2')).toBeUndefined();
      expect(result.current.itemState('right', 'r2')).toBeUndefined();
    });
  });

  describe('AccessibilityInfo announcement', () => {
    const originalOS = Platform.OS;

    afterEach(() => {
      Platform.OS = originalOS;
    });

    it('does not announce while unsubmitted', async () => {
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      await renderHook(() => useMatching(defaultProps));

      expect(announceSpy).not.toHaveBeenCalled();
      announceSpy.mockRestore();
    });

    it('announces the correct label when answer is correct', async () => {
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      await renderHook(() => useMatching({ ...defaultProps, initialAnswer: allCorrectAnswer }));

      expect(announceSpy).toHaveBeenCalledWith('activity.matching.correct');
      announceSpy.mockRestore();
    });

    it('announces the incorrect label when answer is incorrect', async () => {
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      await renderHook(() => useMatching({ ...defaultProps, initialAnswer: mixedAnswer }));

      expect(announceSpy).toHaveBeenCalledWith('activity.matching.incorrect');
      announceSpy.mockRestore();
    });

    it('announces once when transitioning from unsubmitted to submitted', async () => {
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      const { result } = await renderHook(() => useMatching(defaultProps));

      expect(announceSpy).not.toHaveBeenCalled();

      await act(() => {
        result.current.dispatch({ type: 'submit', answer: allCorrectAnswer });
      });

      await waitFor(() => expect(announceSpy).toHaveBeenCalledWith('activity.matching.correct'));
      expect(announceSpy).toHaveBeenCalledTimes(1);
      announceSpy.mockRestore();
    });

    it('does not announce on Android', async () => {
      Platform.OS = 'android';
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      await renderHook(() => useMatching({ ...defaultProps, initialAnswer: allCorrectAnswer }));

      expect(announceSpy).not.toHaveBeenCalled();
      announceSpy.mockRestore();
    });

    it.each(['ios', 'web'] as const)('still announces on %s', async (os) => {
      Platform.OS = os;
      const announceSpy = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation(() => {});
      announceSpy.mockClear();

      await renderHook(() => useMatching({ ...defaultProps, initialAnswer: allCorrectAnswer }));

      expect(announceSpy).toHaveBeenCalledWith('activity.matching.correct');
      announceSpy.mockRestore();
    });
  });
});
