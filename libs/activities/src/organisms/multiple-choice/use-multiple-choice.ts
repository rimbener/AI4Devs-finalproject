import { useLocalization } from '@helsoft/localization';
import type { MultipleChoiceAnswer } from '@helsoft/types';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { hasCorrectOption, optionState } from './multiple-choice.helpers';
import type { UseMultipleChoiceProps } from './multiple-choice.types';

/**
 * Multiple-choice interaction + derived state.
 * Owns pending selection + graded answer; locks once graded. Handlers stay in the component.
 */
export const useMultipleChoice = ({
  slide,
  initialAnswer = null,
}: UseMultipleChoiceProps) => {
  const { t } = useLocalization();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    initialAnswer?.selectedOptionId ?? null,
  );
  const [answer, setAnswer] = useState<MultipleChoiceAnswer | null>(initialAnswer);

  const isUnavailable = !hasCorrectOption(slide);
  const answered = !!answer;
  const locked = answered;
  const isCorrect = answer?.isCorrect ?? false;
  const canSubmit = !!selectedOptionId && !locked;

  useEffect(() => {
    if (!isUnavailable && answered && Platform.OS !== 'android') {
      AccessibilityInfo.announceForAccessibility(
        isCorrect ? t('activity.mcq.correct') : t('activity.mcq.incorrect'),
      );
    }
  }, [isUnavailable, answered, isCorrect, t]);

  const stateForOption = (optionId: string) =>
    optionState(optionId, slide.correctOptionId, selectedOptionId, answered);

  return {
    answer,
    setAnswer,
    selectedOptionId,
    setSelectedOptionId,
    isUnavailable,
    answered,
    locked,
    canSubmit,
    isCorrect,
    stateForOption,
  };
};
