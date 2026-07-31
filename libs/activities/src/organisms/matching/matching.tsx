import { Button, Card, Icon } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { gradeMatching, isMatchingSlideValid } from '../../grading/grade-matching';
import { itemAccessibilityLabel } from './matching.helpers';
import type { ItemVisualState, MatchingItemView, MatchingProps } from './matching.types';
import { useMatching } from './use-matching';

/** Matching — pairs + grades; reports via `onAnswered` once. */
export const Matching = ({
  slide,
  onAnswered,
  initialAnswer = null,
  initialPairs = [],
}: MatchingProps) => {
  const { theme } = useUnistyles();
  const { t } = useLocalization();
  const valid = isMatchingSlideValid(slide);

  const {
    answer,
    result,
    locked,
    isUnavailable,
    formedPairs,
    itemState,
    dispatch,
    allPaired,
  } = useMatching({
    leftItems: slide.leftItems,
    rightItems: slide.rightItems,
    unavailable: !valid,
    initialPairs,
    initialAnswer,
  });

  const handleSubmit = () => {
    if (answer || !valid) return;
    const graded = gradeMatching(slide, formedPairs);
    dispatch({ type: 'submit', answer: graded });
    onAnswered?.(graded);
  };

  if (isUnavailable) {
    return (
      <Card testID="matching-root" style={styles.root}>
        <Text style={styles.prompt}>{t('activity.matching.unavailable')}</Text>
      </Card>
    );
  }

  const handleItemPress = (column: 'left' | 'right', id: string) => {
    dispatch({ type: 'item/press', column, id });
  };

  const renderItem = (column: 'left' | 'right', item: MatchingItemView) => {
    const state = itemState(column, item.id);
    const feedbackIcon =
      state === 'correct' ? 'check_circle' : state === 'incorrect' ? 'cancel' : null;
    const feedbackColor = state === 'correct' ? theme.colors.tertiary : theme.colors.error;
    const accessibilityLabel = itemAccessibilityLabel(
      item,
      state,
      t('activity.matching.correctPair'),
      t('activity.matching.incorrectPair'),
    );

    return (
      <Pressable
        key={item.id}
        // State suffix so Storybook e2e can assert pending/paired (RNW omits aria-selected/checked).
        testID={`matching-item-${item.id}--${state ?? 'idle'}`}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled: locked,
          selected: state === 'pending',
          checked: state === 'paired',
        }}
        onPress={locked ? undefined : () => handleItemPress(column, item.id)}
        style={[styles.item, styles.itemState(state)]}
      >
        <Text style={styles.itemLabel(state)}>{item.label}</Text>
        {feedbackIcon ? <Icon name={feedbackIcon} size={22} fill color={feedbackColor} /> : null}
      </Pressable>
    );
  };

  return (
    <Card testID="matching-root" style={styles.root}>
      <Text style={styles.prompt}>{slide.content}</Text>
      <View testID="matching-columns" style={styles.columns}>
        <View testID="matching-column-left" style={styles.column}>
          {slide.leftItems.map((item) => renderItem('left', item))}
        </View>
        <View testID="matching-column-right" style={styles.column}>
          {slide.rightItems.map((item) => renderItem('right', item))}
        </View>
      </View>
      {!locked ? (
        <Button disabled={!allPaired} fullWidth onPress={handleSubmit}>
          {t('activity.matching.submit')}
        </Button>
      ) : null}
      {result ? (
        <View
          testID="matching-result-banner"
          accessibilityRole={result.isCorrect ? undefined : 'alert'}
          style={[styles.banner, result.isCorrect ? styles.bannerCorrect : styles.bannerIncorrect]}
        >
          <Text
            style={styles.bannerText(result.isCorrect)}
            accessibilityLiveRegion={result.isCorrect ? 'polite' : 'assertive'}
          >
            {result.isCorrect ? t('activity.matching.correct') : t('activity.matching.incorrect')}
          </Text>
          <Text style={styles.summary(result.isCorrect)}>{result.summary}</Text>
        </View>
      ) : null}
      {result && slide.explanation ? (
        <View testID="matching-explanation" style={styles.explanation}>
          <Text style={styles.explanationHeading}>{t('activity.matching.explanationHeading')}</Text>
          <Text style={styles.explanationBody}>{slide.explanation}</Text>
        </View>
      ) : null}
    </Card>
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
  columns: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  column: {
    flex: 1,
    gap: theme.spacing.s3,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s3,
    borderRadius: theme.shape.md,
    minHeight: theme.layout.touchTarget,
  },
  itemState: (state: ItemVisualState) => {
    switch (state) {
      case 'pending':
        return {
          backgroundColor: theme.colors.primaryContainer,
          borderWidth: 1,
          borderColor: theme.colors.tertiary,
        };
      case 'paired':
        return {
          backgroundColor: theme.colors.secondaryContainer,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      case 'correct':
        return {
          backgroundColor: theme.utils.mixHex(
            theme.colors.tertiaryContainer,
            theme.colors.surface,
            0.55,
          ),
          borderWidth: 1,
          borderColor: theme.colors.tertiary,
        };
      case 'incorrect':
        return {
          backgroundColor: theme.colors.errorContainer,
          borderWidth: 1,
          borderColor: theme.colors.error,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        };
    }
  },
  itemLabel: (state: ItemVisualState) => ({
    ...theme.typography.bodyLarge,
    flex: 1,
    color:
      state === 'pending'
        ? theme.colors.onPrimaryContainer
        : state === 'paired'
          ? theme.colors.onSecondaryContainer
          : state === 'correct'
            ? theme.colors.onTertiaryContainer
            : state === 'incorrect'
              ? theme.colors.onErrorContainer
              : theme.colors.onSurface,
  }),
  banner: {
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
    gap: theme.spacing.s1,
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
  summary: (isCorrect: boolean) => ({
    ...theme.typography.bodySmall,
    color: isCorrect ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer,
  }),
  explanation: {
    gap: theme.spacing.s1,
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
