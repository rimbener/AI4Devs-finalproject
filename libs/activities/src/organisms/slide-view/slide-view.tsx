import { useLocalization } from '@helsoft/localization';
import { ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { OpenEndedBody } from '../../molecules/open-ended-body/open-ended-body';
import { SlideImage } from '../../molecules/slide-image/slide-image';
import { FillInTheBlank } from '../../templates/fill-in-the-blank/fill-in-the-blank';
import { Flashcard } from '../../templates/flashcard/flashcard';
import { Matching } from '../../templates/matching/matching';
import { MultipleChoice } from '../../templates/multiple-choice/multiple-choice';
import { isInstructional } from './slide-view.helpers';
import type { ActivityBodyProps, SlideViewProps } from './slide-view.types';
import { useSlideLayout } from './use-slide-layout';

/**
 * SlideView — presentational renderer for one content Slide (instructional or activity).
 * Results slide is NOT rendered here — the player mounts LessonResults for that step.
 */
export const SlideView = ({
  slide,
  availableHeight,
  onAnswered,
  initialAnswer,
}: SlideViewProps) => {
  const { t } = useLocalization();
  const { isSplit } = useSlideLayout({ image: slide.image, availableHeight });
  const body = isInstructional(slide) ? (
    <Text style={styles.content}>{slide.content}</Text>
  ) : (
    <ActivityBody slide={slide} onAnswered={onAnswered} initialAnswer={initialAnswer} />
  );

  return (
    <View style={styles.root(isSplit, availableHeight)}>
      <Text accessibilityRole="header" style={styles.title}>
        {slide.title}
      </Text>
      {isSplit ? (
        <View testID="slide-split-row" style={styles.splitRow}>
          <View testID="slide-image-pane" style={styles.splitPane}>
            <SlideImage image={slide.image} layout="split" />
          </View>
          <View testID="slide-body-pane" style={styles.splitPane}>
            <ScrollView
              accessible
              accessibilityLabel={t('player.slideBody.scroll')}
              focusable
              testID="slide-body-scroll"
              nestedScrollEnabled
              style={styles.bodyScroll}
            >
              {body}
            </ScrollView>
          </View>
        </View>
      ) : (
        <>
          <SlideImage image={slide.image} layout="stacked" />
          {body}
        </>
      )}
    </View>
  );
};

const ActivityBody = ({ slide, onAnswered, initialAnswer }: ActivityBodyProps) => {
  switch (slide.activityType) {
    case 'multiple-choice':
      return (
        <MultipleChoice
          slide={slide}
          onAnswered={onAnswered}
          initialAnswer={
            initialAnswer?.activityType === 'multiple-choice' ? initialAnswer : undefined
          }
        />
      );
    case 'fill-in-the-blank':
      return (
        <FillInTheBlank
          slide={slide}
          onAnswered={onAnswered}
          initialAnswer={
            initialAnswer?.activityType === 'fill-in-the-blank' ? initialAnswer : undefined
          }
        />
      );
    case 'matching':
      return (
        <Matching
          slide={slide}
          onAnswered={onAnswered}
          initialAnswer={initialAnswer?.activityType === 'matching' ? initialAnswer : undefined}
        />
      );
    case 'flashcard':
      return (
        <Flashcard
          slide={slide}
          onAnswered={onAnswered}
          initialAnswer={initialAnswer?.activityType === 'flashcard' ? initialAnswer : undefined}
        />
      );
    case 'open-ended':
      return (
        <OpenEndedBody
          slide={slide}
          onAnswered={onAnswered}
          initialAnswer={initialAnswer?.activityType === 'open-ended' ? initialAnswer : undefined}
        />
      );
  }
};

const styles = StyleSheet.create((theme) => ({
  root: (isSplit: boolean, availableHeight: number | null | undefined) => ({
    gap: theme.spacing.s3,
    ...(isSplit && availableHeight ? { height: availableHeight } : { flex: 1 }),
    padding: theme.spacing.s1,
  }),
  title: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onSurface,
  },
  content: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  splitRow: {
    flexDirection: 'row' as const,
    gap: theme.layout.gutter,
    flex: 1,
    minHeight: 0,
  },
  splitPane: {
    flex: 1,
  },
  bodyScroll: {
    flex: 1,
  },
}));
