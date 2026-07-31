import { useLocalization } from '@helsoft/localization';
import { useEffect, useReducer } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { findPairForItem } from './matching.helpers';
import type { ItemVisualState, MatchingResult, UseMatchingProps } from './matching.types';
import { createMatchingInitialState, matchingReducer } from './use-matching.reducer';

/**
 * Matching interaction + derived state for the matching organism.
 * Owns pending / formedPairs / answer via reducer; locks once graded.
 */
export const useMatching = ({
  leftItems,
  rightItems,
  unavailable = false,
  initialPairs = [],
  initialAnswer = null,
}: UseMatchingProps) => {
  const { t } = useLocalization();
  const [state, dispatch] = useReducer(matchingReducer, undefined, () =>
    createMatchingInitialState(initialPairs, initialAnswer),
  );
  const { pending, formedPairs, answer } = state;

  const result: MatchingResult | null = answer
    ? {
        pairs: answer.pairs,
        isCorrect: answer.isCorrect,
        summary: t('activity.matching.summary', {
          correct: answer.correctPairCount,
          total: answer.totalPairCount,
        }),
      }
    : null;

  const locked = !!answer;
  const allPaired = formedPairs.length === leftItems.length;
  const isEmpty = leftItems.length === 0;
  const isUnequal = leftItems.length !== rightItems.length;
  const isUnavailable = unavailable || isEmpty || isUnequal;

  useEffect(() => {
    if (!result || Platform.OS === 'android') return;
    AccessibilityInfo.announceForAccessibility(
      result.isCorrect ? t('activity.matching.correct') : t('activity.matching.incorrect'),
    );
  }, [result, t]);

  const itemState = (column: 'left' | 'right', id: string): ItemVisualState => {
    if (result) {
      const graded = result.pairs.find((pair) =>
        column === 'left' ? pair.leftId === id : pair.rightId === id,
      );
      if (graded) return graded.isCorrect ? 'correct' : 'incorrect';
      return undefined;
    }
    if (pending?.column === column && pending.id === id) return 'pending';
    if (findPairForItem(formedPairs, id)) return 'paired';
    return undefined;
  };

  return {
    pending,
    answer,
    result,
    locked,
    allPaired,
    formedPairs,
    isUnavailable,
    dispatch,
    itemState,
  };
};
