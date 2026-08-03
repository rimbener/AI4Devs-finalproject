import { ACTIVITY_FOOTER_COLLAPSE_TEST_ID } from '@helsoft/activities/test-ids';
import { Icon, IconButton } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import React from 'react';
import { Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ActivityResultExplanation } from '../activity-result-explanation/activity-result-explanation';

type FeedbackPanelProps = {
  summary?: string;
  isCorrect?: boolean;
  explanation?: string;
};

const FOOTER_ICON_SIZE = 40;

export const ActivityResultContent = ({
  isCorrect = false,
  summary,
  explanation,
}: FeedbackPanelProps) => {
  const { t } = useLocalization();
  const { theme } = useUnistyles();

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      <View style={styles.bannerContent}>
        <View
          testID="activity-result-banner"
          accessibilityRole={isCorrect ? undefined : 'alert'}
          style={[styles.banner, isCorrect ? styles.bannerCorrect : styles.bannerIncorrect]}
        >
          <View style={styles.bannerResultContent}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Icon
                name={isCorrect ? 'check_circle' : 'cancel'}
                size={22}
                fill
                color={isCorrect ? theme.colors.tertiary : theme.colors.error}
              />
            </View>
            <Text
              style={styles.bannerText(isCorrect)}
              accessibilityLiveRegion={isCorrect ? 'polite' : 'assertive'}
            >
              {isCorrect ? t('activity.result.correct') : t('activity.result.incorrect')}
            </Text>
          </View>
          {summary ? <Text style={styles.summary(isCorrect)}>{summary}</Text> : null}
        </View>
        {explanation ? (
          <IconButton
            testID={ACTIVITY_FOOTER_COLLAPSE_TEST_ID}
            icon={collapsed ? 'expand_more' : 'expand_less'}
            size={FOOTER_ICON_SIZE}
            accessibilityLabel={
              collapsed ? t('activity.footer.expandResults') : t('activity.footer.collapseResults')
            }
            onPress={() => setCollapsed((current) => !current)}
          />
        ) : null}
      </View>
      {explanation && !collapsed ? (
        <ActivityResultExplanation
          testID="activity-result-explanation"
          heading={t('activity.result.explanation')}
          body={explanation}
          style={styles.explanation}
        />
      ) : null}
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
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerResultContent: {
    flexDirection: 'row',
  },
  banner: {
    flex: 1,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
    marginRight: theme.spacing.s2,
  },
  bannerCorrect: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  bannerIncorrect: {
    backgroundColor: theme.colors.errorContainer,
  },
  bannerText: (isCorrect: boolean) => ({
    marginLeft: theme.spacing.s1,
    ...theme.typography.bodyMedium,
    color: isCorrect ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer,
  }),
  explanation: {
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
  summary: (isCorrect: boolean) => ({
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.s1,
    marginLeft: theme.spacing.s1,
    color: isCorrect ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer,
  }),
}));
