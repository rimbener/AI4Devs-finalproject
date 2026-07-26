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

  const refetch = useCallback(
    () => {
      resetDelete();
      void queryRefetch();
    },
    // Stryker disable next-line ArrayDeclaration: equivalent mutant — TanStack binds both
    // `mutation.reset` and `query.refetch` once in their observers' constructors (see
    // `@tanstack/query-core`'s MutationObserver/QueryObserver), so both are referentially stable
    // for the life of this hook instance regardless of what's in this array.
    [resetDelete, queryRefetch],
  );

  const deleteDocument = useCallback(
    (id: string) => mutateAsync(id),
    // Stryker disable next-line ArrayDeclaration: equivalent mutant — `mutateAsync` is bound
    // once by TanStack's MutationObserver constructor, so it's referentially stable for the
    // life of this hook instance regardless of what's in this array.
    [mutateAsync],
  );

  return {
    documents: data ?? [],
    isLoading,
    // D4: mutation-first merge reproduces the old reducer's last-writer-wins slot.
    error: deleteError ?? queryError,
    refetch,
    deleteDocument,
  };
};
