import { Button, LessonList } from '@helsoft/components';
import { useLessons } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { toLessonListItems, toLessonListState } from './saved-lessons.helpers';

/**
 * SavedLessons — Home wiring: useLessons + t()/date format → LessonList + reopen/delete.
 * Persistent New Lesson CTA (content + empty) opens the PDF files tab.
 */
export const SavedLessons = () => {
  const { lessons, isLoading, error, refetch, deleteLesson } = useLessons();
  const { t, locale } = useLocalization();
  const router = useRouter();

  const state = toLessonListState(isLoading, error, lessons.length);
  const items = useMemo(() => toLessonListItems(lessons, locale, t), [lessons, locale, t]);
  const deleteFailedLabel = t('home.delete.failed');

  const onOpenLesson = useCallback(
    (id: string) => {
      router.push({ pathname: '/lesson/[id]/player', params: { id } });
    },
    [router],
  );

  const onNewLesson = useCallback(() => {
    router.push('/pdf-files');
  }, [router]);

  const onDelete = useCallback(
    (id: string) => {
      // SignOut pattern: swallow so a rethrown hook error never floats unhandled.
      void deleteLesson(id).catch(() => {});
    },
    [deleteLesson],
  );

  // accessibilityLiveRegion covers Android/Web; iOS needs announceForAccessibility (WCAG 4.1.3).
  useEffect(() => {
    if (state === 'content' && error) {
      AccessibilityInfo.announceForAccessibility(deleteFailedLabel);
    }
  }, [state, error, deleteFailedLabel]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          {t('home.savedLessons')}
        </Text>
        <Button onPress={onNewLesson}>{t('nav.newLesson')}</Button>
      </View>
      {state === 'content' ? (
        <Text style={styles.count}>{t('lessons.count', { count: lessons.length })}</Text>
      ) : null}
      <LessonList
        state={state}
        lessons={items}
        onOpenLesson={onOpenLesson}
        onRetry={refetch}
        onDelete={onDelete}
      />
      {state === 'content' && error ? (
        <Text accessibilityLiveRegion="assertive" style={styles.deleteError}>
          {deleteFailedLabel}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    gap: theme.spacing.s3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  heading: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onSurface,
    flexShrink: 1,
  },
  count: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  deleteError: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
  },
}));
