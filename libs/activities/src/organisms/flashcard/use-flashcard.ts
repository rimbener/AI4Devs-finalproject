import { useLocalization } from '@helsoft/localization';
import type { FlashcardAnswer } from '@helsoft/types';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { isFlashcardSlideValid } from './flashcard.helpers';
import type { UseFlashcardProps } from './flashcard.types';

/**
 * Flashcard interaction + derived state: reveal (one-way) then self-mark (one-time lock).
 * Handlers stay in the component.
 */
export const useFlashcard = ({
  slide,
  initialAnswer = null,
  initialRevealed = false,
}: UseFlashcardProps) => {
  const { t } = useLocalization();
  const [revealed, setRevealed] = useState(initialRevealed || !!initialAnswer);
  const [answer, setAnswer] = useState<FlashcardAnswer | null>(initialAnswer);

  const locked = !!answer;
  const isRevealed = revealed || !!answer;
  const isUnavailable = !isFlashcardSlideValid(slide);

  useEffect(() => {
    if (!isRevealed || Platform.OS === 'android') return;
    AccessibilityInfo.announceForAccessibility(
      `${t('activity.flashcard.answerHeading')}: ${slide.back}`,
    );
  }, [isRevealed, slide.back, t]);

  return {
    revealed,
    answer,
    locked,
    isRevealed,
    isUnavailable,
    setRevealed,
    setAnswer,
  };
};
