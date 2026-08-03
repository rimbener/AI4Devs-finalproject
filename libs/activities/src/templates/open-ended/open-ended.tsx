import { Card, TextField } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActivityResultExplanation } from '../../atoms/activity-result-explanation/activity-result-explanation';
import { ActivityResultPanel } from '../../molecules/activity-result-panel/activity-result-panel';
import { shouldShowExplanation } from './open-ended.helpers';
import type { OpenEndedProps } from './open-ended.types';
import { useOpenEnded } from './use-open-ended';

/**
 * OpenEnded — presentational activity organism.
 * Owns draft/lock via use-open-ended; reports via `onSubmit` once. No grader.
 */
export const OpenEnded = ({
  prompt,
  modelAnswer,
  explanation,
  unavailable = false,
  initialSubmittedAnswer = null,
  maxLength,
  onSubmit,
}: OpenEndedProps) => {
  const { t } = useLocalization();
  const { draft, setDraft, submitted, setSubmitted, locked, isUnavailable } = useOpenEnded({
    initialSubmittedAnswer,
    unavailable,
  });

  const handleChangeText = (text: string) => {
    if (locked) return;
    setDraft(text);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(draft);
  };

  if (isUnavailable) {
    return (
      <Card testID="open-ended-root" style={styles.root}>
        <Text style={styles.prompt}>{t('activity.result.unavailable')}</Text>
      </Card>
    );
  }

  return (
    <>
      <Card testID="open-ended-root" style={styles.root}>
        <Text style={styles.prompt}>{prompt}</Text>
        <TextField
          accessibilityLabel={t('activity.openEnded.answerInput')}
          accessibilityState={{ disabled: locked }}
          value={draft}
          maxLength={maxLength}
          disabled={locked}
          multiline
          variant="outlined"
          onChangeText={handleChangeText}
        />
      </Card>
      <ActivityResultPanel canSubmit={!locked} hasResult={submitted} onSubmit={handleSubmit}>
        {submitted ? (
          <View testID="open-ended-comparison" style={styles.comparison}>
            <ActivityResultExplanation
              testID="open-ended-your-answer"
              heading={t('activity.openEnded.yourAnswer')}
              body={draft}
              accessibilityLiveRegion="polite"
            />
            <ActivityResultExplanation
              testID="open-ended-model-answer"
              heading={t('activity.openEnded.modelAnswer')}
              body={modelAnswer}
              accessibilityLiveRegion="polite"
            />
            {shouldShowExplanation(submitted, explanation) ? (
              <ActivityResultExplanation
                testID="open-ended-explanation"
                heading={t('activity.result.explanation')}
                body={explanation}
              />
            ) : null}
          </View>
        ) : null}
      </ActivityResultPanel>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.s4,
  },
  prompt: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
  },
  comparison: {
    gap: theme.spacing.s3,
  },
}));
