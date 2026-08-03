import { Card } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActivityResultContent } from '../../atoms/activity-result-content/activity-result-content';
import { gradeFillInTheBlank } from '../../grading/grade-fill-in-the-blank';
import { ActivityResultPanel } from '../../molecules/activity-result-panel/activity-result-panel';
import type { FillInTheBlankProps } from './fill-in-the-blank.types';
import { useFillInTheBlank } from './use-fill-in-the-blank';

/**
 * FillInTheBlank — activity organism. Owns value + grading; reports via `onAnswered` once.
 */
export const FillInTheBlank = ({
  slide,
  onAnswered,
  initialAnswer = null,
}: FillInTheBlankProps) => {
  const { t } = useLocalization();

  const { value, setValue, answer, setAnswer, parts, locked, isUnavailable, maxLength } =
    useFillInTheBlank({ slide, initialAnswer });

  const handleSubmit = () => {
    if (answer || isUnavailable) return;
    const graded = gradeFillInTheBlank(slide, value);
    setAnswer(graded);
    onAnswered?.(graded);
  };

  if (isUnavailable || !parts) {
    return (
      <Card style={styles.root}>
        <Text style={styles.prompt}>{t('activity.result.unavailable')}</Text>
      </Card>
    );
  }

  return (
    <>
      <Card style={styles.root}>
        <View style={styles.promptRow}>
          {parts.before.length > 0 ? <Text style={styles.prompt}>{parts.before}</Text> : null}
          <TextInput
            accessibilityLabel={t('activity.fillInTheBlank.blankInput')}
            accessibilityState={{ disabled: locked }}
            value={value}
            maxLength={maxLength}
            editable={!locked}
            onChangeText={locked ? undefined : setValue}
            onSubmitEditing={locked ? undefined : handleSubmit}
            returnKeyType="done"
            style={styles.blank}
          />
          {parts.after.length > 0 ? <Text style={styles.prompt}>{parts.after}</Text> : null}
        </View>
      </Card>
      <ActivityResultPanel canSubmit={!locked} hasResult={!!answer} onSubmit={handleSubmit}>
        {answer ? (
          <ActivityResultContent
            isCorrect={answer.isCorrect}
            summary={answer.isCorrect ? undefined : answer.acceptedAnswerShown}
            explanation={slide.explanation}
          />
        ) : null}
      </ActivityResultPanel>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.s4,
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  prompt: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
  },
  blank: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    minWidth: theme.spacing.s16,
    minHeight: theme.layout.touchTarget,
    paddingVertical: theme.spacing.s1,
  },
  bannerText: (isCorrect: boolean) => ({
    ...theme.typography.bodyMedium,
    color: isCorrect ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer,
  }),
}));
