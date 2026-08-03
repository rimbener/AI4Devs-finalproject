import {
  FLASHCARD_ANSWER_TEST_ID,
  FLASHCARD_MARK_NOT_RECALLED_TEST_ID,
  FLASHCARD_MARK_RECALLED_TEST_ID,
  FLASHCARD_REVEAL_TEST_ID,
} from '@helsoft/activities/test-ids';
import { Button, Card, Icon } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useActivityFooter } from '../../activity-scroll-view-provider/activity-scroll-view-provider';
import { ActivityResultExplanation } from '../../atoms/activity-result-explanation/activity-result-explanation';
import { buildFlashcardAnswer } from './flashcard.helpers';
import type { FlashcardProps } from './flashcard.types';
import { useFlashcard } from './use-flashcard';

/**
 * Flashcard — activity organism. Owns reveal (one-way) + self-mark (one-time lock);
 * self-marked only — no grading, reports via `onAnswered` once on self-mark.
 */
export const Flashcard = ({
  slide,
  onAnswered,
  initialAnswer = null,
  initialRevealed = false,
}: FlashcardProps) => {
  const { theme } = useUnistyles();
  const { t } = useLocalization();

  const { answer, setAnswer, isRevealed, isUnavailable, locked, setRevealed } = useFlashcard({
    slide,
    initialAnswer,
    initialRevealed,
  });

  // Flashcard has no ActivityResultPanel (self-mark only, no submit), so gate the
  // shared footer Next itself: hidden until the flashcard is self-marked, restored
  // to the provider default (visible) on unmount. Standalone (Storybook) there is
  // no provider, so this is a no-op.
  const setNextVisible = useActivityFooter()?.setNextVisible ?? null;
  useLayoutEffect(() => {
    if (isUnavailable) return;
    setNextVisible?.(!!answer);
    return () => setNextVisible?.(true);
  }, [setNextVisible, answer, isUnavailable]);

  if (isUnavailable) {
    return (
      <Card testID="flashcard-root">
        <Text style={styles.prompt}>{t('activity.result.unavailable')}</Text>
      </Card>
    );
  }

  // No `isUnavailable`/`isRevealed`/`locked` guards here: the component already
  // returned the unavailable notice above when relevant, the Reveal button only
  // renders while `!isRevealed`, and each self-mark `Pressable`'s `onPress` is
  // `undefined` once `locked` — so these handlers are only ever reachable through
  // the one interaction each is meant to handle.
  const handleReveal = () => {
    setRevealed(true);
  };

  const handleSelfMark = (recalled: boolean) => {
    const built = buildFlashcardAnswer(slide, recalled);
    setAnswer(built);
    onAnswered?.(built);
  };

  const renderMarkButton = (recalled: boolean) => {
    const isChosen = answer ? answer.recalled === recalled : false;
    const idleLabel = recalled
      ? t('activity.flashcard.recalled')
      : t('activity.flashcard.notRecalled');
    const confirmedLabel = recalled
      ? t('activity.flashcard.recalledConfirmed')
      : t('activity.flashcard.notRecalledConfirmed');
    const label = isChosen ? confirmedLabel : idleLabel;
    const iconName = isChosen ? (recalled ? 'check_circle' : 'cancel') : null;
    // Self-marked, not graded — both marks share one neutral color pairing so the icon
    // never contradicts its own (static) container chrome and neither mark reads as
    // "correct" vs. "wrong" (unlike the graded tertiary/error pairing used elsewhere).
    const iconColor = theme.colors.onSecondaryContainer;

    return (
      <Pressable
        testID={recalled ? FLASHCARD_MARK_RECALLED_TEST_ID : FLASHCARD_MARK_NOT_RECALLED_TEST_ID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: locked, selected: isChosen }}
        onPress={locked ? undefined : () => handleSelfMark(recalled)}
        style={[styles.markButton, isChosen && styles.markButtonChosen]}
      >
        <Text style={styles.markButtonLabel(isChosen)}>{label}</Text>
        {iconName ? <Icon name={iconName} size={20} fill color={iconColor} /> : null}
      </Pressable>
    );
  };

  return (
    <Card testID="flashcard-root">
      <Text style={styles.prompt}>{slide.content}</Text>
      {!isRevealed ? (
        <Button testID={FLASHCARD_REVEAL_TEST_ID} fullWidth onPress={handleReveal}>
          {t('activity.flashcard.reveal')}
        </Button>
      ) : (
        <>
          <ActivityResultExplanation
            testID={FLASHCARD_ANSWER_TEST_ID}
            heading={t('activity.result.answerHeading')}
            body={slide.back}
          />
          {slide.explanation ? (
            <ActivityResultExplanation
              testID="flashcard-explanation"
              heading={t('activity.result.explanation')}
              body={slide.explanation}
            />
          ) : null}
          <View testID="flashcard-self-mark" style={styles.selfMark}>
            {renderMarkButton(true)}
            {renderMarkButton(false)}
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create((theme) => ({
  prompt: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.s3,
  },
  answer: {
    gap: theme.spacing.s1,
  },
  selfMark: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
    marginTop: theme.spacing.s4,
  },
  markButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s2,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s3,
    borderRadius: theme.shape.md,
    minHeight: theme.layout.touchTarget,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  markButtonChosen: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  markButtonLabel: (isChosen: boolean) => ({
    ...theme.typography.labelLarge,
    color: isChosen ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
  }),
}));
