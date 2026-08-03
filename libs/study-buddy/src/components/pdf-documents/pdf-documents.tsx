import { PdfDocumentList, TabsHeader } from '@helsoft/components';
import { useCanCreate, usePdfDocuments } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NewLessonDialog } from '../new-lesson-dialog/new-lesson-dialog';
import { toPdfDocumentListItems, toPdfDocumentListState } from './pdf-documents.helpers';

/**
 * PdfDocuments — PDF list wiring: usePdfDocuments + t() → PdfDocumentList.
 * Self-contained like SavedLessons: router for open lesson, profile for create,
 * NewLessonDialog for upload/generate; delete stays in the hook.
 */
export const PdfDocuments = () => {
  const router = useRouter();
  const { t } = useLocalization();
  const { canCreate } = useCanCreate();
  const { documents, isLoading, error, refetch, deleteDocument } = usePdfDocuments();

  const [generateDocumentId, setGenerateDocumentId] = useState<string | undefined>();

  const state = toPdfDocumentListState(isLoading, error, documents.length);
  const items = useMemo(() => toPdfDocumentListItems(documents), [documents]);

  const handleOpenLesson = useCallback(
    (documentId: string) => {
      const lessonId = documents.find((doc) => doc.id === documentId)?.lessonId?.trim();
      if (!lessonId) return;
      router.push({ pathname: '/lesson/[id]/player', params: { id: lessonId } });
    },
    [documents, router],
  );

  // accessibilityLiveRegion covers Android/Web; iOS needs announceForAccessibility (WCAG 4.1.3).
  useEffect(() => {
    if (state === 'content' && error) {
      AccessibilityInfo.announceForAccessibility(t('pdfList.delete.failed'));
    }
  }, [state, error, t]);

  return (
    <View style={styles.root}>
      <TabsHeader title={t('pdfList.heading')}>
        {canCreate ? (
          <NewLessonDialog
            onExtracted={refetch}
            onGenerated={refetch}
            generateDocumentId={generateDocumentId}
            onGenerateHandled={() => setGenerateDocumentId(undefined)}
          />
        ) : null}
      </TabsHeader>

      <PdfDocumentList
        state={state}
        documents={items}
        onGenerate={canCreate ? setGenerateDocumentId : undefined}
        onOpenLesson={handleOpenLesson}
        onRetry={refetch}
        onDelete={deleteDocument}
      />
      {state === 'content' && error ? (
        <Text accessibilityLiveRegion="assertive" style={styles.deleteError}>
          {t('pdfList.delete.failed')}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    gap: theme.spacing.s3,
    marginTop: theme.spacing.s4,
  },
  deleteError: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
  },
}));
