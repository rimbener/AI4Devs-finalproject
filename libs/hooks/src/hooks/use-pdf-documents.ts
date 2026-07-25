import { PdfDocumentsService } from '@helsoft/supabase-services';
import type { PdfDocumentSummary } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { UsePdfDocumentsResult } from './use-pdf-documents.types';

/** Query key for the learner's uploaded-document list. */
export const pdfDocumentsQueryKey = ['pdf-documents'] as const;

/**
 * React integration over PdfDocumentsService. Drives PDF-list Loading/Content/Empty/Error via
 * `{ documents, isLoading, error, refetch, deleteDocument }`. A successful delete filters the
 * cache directly with `setQueryData` — never `invalidateQueries` — so there is no
 * post-mutation refetch or loading flicker.
 */
export const usePdfDocuments = (): UsePdfDocumentsResult => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: pdfDocumentsQueryKey,
    queryFn: () => PdfDocumentsService.getDocuments(),
  });

  const {
    mutateAsync,
    error: deleteError,
    reset: resetDelete,
  } = useMutation({
    mutationFn: (id: string) => PdfDocumentsService.deleteDocument(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<PdfDocumentSummary[]>(pdfDocumentsQueryKey, (current) =>
        (current ?? []).filter((document) => document.id !== id),
      );
    },
  });

  const refetch = useCallback(() => {
    resetDelete();
    void queryRefetch();
  }, [resetDelete, queryRefetch]);

  const deleteDocument = useCallback((id: string) => mutateAsync(id), [mutateAsync]);

  return {
    documents: data ?? [],
    isLoading,
    // D4: mutation-first merge reproduces the old reducer's last-writer-wins slot.
    error: deleteError ?? queryError,
    refetch,
    deleteDocument,
  };
};
