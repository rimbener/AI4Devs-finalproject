import {
  MULTIPLE_CHOICE_SUBMIT_TEST_ID,
  multipleChoiceOptionTestId,
} from '@helsoft/activities/test-ids';
import { AnswerOption, Card } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ActivityResultContent } from '../../atoms/activity-result-content/activity-result-content';
import { gradeMultipleChoice } from '../../grading/grade-multiple-choice';
import { ActivityResultPanel } from '../../molecules/activity-result-panel/activity-result-panel';
import { optionAccessibilityLabel, optionMarkerAt } from './multiple-choice.helpers';
import type { MultipleChoiceProps } from './multiple-choice.types';
import { useMultipleChoice } from './use-multiple-choice';

/**
 * MultipleChoice — activity organism. Owns selection + grading; reports via `onAnswered` once.
 */
export const MultipleChoice = ({
  slide,
  onAnswered,
  initialAnswer = null,
}: MultipleChoiceProps) => {
  const { t } = useLocalization();

  const {
    setAnswer,
    selectedOptionId,
    setSelectedOptionId,
    isUnavailable,
    locked,
    canSubmit,
    isCorrect,
    stateForOption,
  } = useMultipleChoice({ slide, initialAnswer });

  const handleSelect = (optionId: string) => {
    if (locked) return;
    setSelectedOptionId(optionId);
  };

  const handleSubmit = () => {
    if (locked || !selectedOptionId) return;
    const graded = gradeMultipleChoice(slide, selectedOptionId);
    setAnswer(graded);
    onAnswered?.(graded);
  };

  if (isUnavailable) {
    return (
      <Card style={styles.root}>
        <Text style={styles.question}>{t('activity.result.unavailable')}</Text>
      </Card>
    );
  }

  return (
    <>
      <Card style={styles.root}>
        <Text style={styles.question}>{slide.content}</Text>
        <View style={styles.options}>
          {slide.options.map((option, index) => {
            const marker = optionMarkerAt(index);
            const state = stateForOption(option.id);
            return (
              <AnswerOption
                key={option.id}
                testID={multipleChoiceOptionTestId(option.id)}
                marker={marker}
                label={option.label}
                state={state}
                disabled={locked}
                accessibilityLabel={optionAccessibilityLabel(
                  marker,
                  option.label,
                  state,
                  t('activity.result.correct'),
                  t('activity.result.incorrect'),
                )}
                onPress={() => handleSelect(option.id)}
              />
            );
          })}
        </View>
      </Card>
      <ActivityResultPanel
        canSubmit={canSubmit}
        hasResult={locked}
        onSubmit={handleSubmit}
        submitTestID={MULTIPLE_CHOICE_SUBMIT_TEST_ID}
      >
        <ActivityResultContent isCorrect={isCorrect} explanation={slide.explanation} />
      </ActivityResultPanel>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.s4,
  },
  question: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
  },
  options: {
    gap: theme.spacing.s3,
  },
  banner: {
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  bannerCorrect: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  bannerIncorrect: {
    backgroundColor: theme.colors.errorContainer,
  },
  bannerText: (isCorrect: boolean) => ({
    ...theme.typography.bodyMedium,
    color: isCorrect ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer,
  }),
  explanation: {
    gap: theme.spacing.s1,
    marginTop: theme.spacing.s3,
  },
  explanationHeading: {
    ...theme.typography.titleSmall,
    color: theme.colors.onSurfaceVariant,
  },
  explanationBody: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
}));
