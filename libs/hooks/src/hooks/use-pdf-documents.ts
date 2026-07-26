import { PdfDocumentsService } from '@helsoft/supabase-services';
import type { PdfDocumentSummary } from '@helsoft/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UsePdfDocumentsResult } from './use-pdf-documents.types';

export const pdfDocumentsQueryKey = ['pdf-documents'] as const;

export const usePdfDocuments = (): UsePdfDocumentsResult => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: pdfDocumentsQueryKey,
    queryFn: () => PdfDocumentsService.getDocuments(),
  });

  const {
    mutate: deleteDocument,
    error: deleteError,
    reset: deleteDocumentReset,
  } = useMutation({
    mutationFn: (id: string) => PdfDocumentsService.deleteDocument(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<PdfDocumentSummary[]>(pdfDocumentsQueryKey, (current) =>
        (current ?? []).filter((document) => document.id !== id),
      );
    },
  });

  // @s23 — the delete error is cleared before the read starts, so a later read failure (not the
  // stale delete error) is what ends up exposed.
  const refetchAndClearDeleteError = () => {
    deleteDocumentReset();
    return refetch();
  };

  return {
    documents: data ?? [],
    isLoading,
    error: deleteError ?? queryError,
    refetch: refetchAndClearDeleteError,
    deleteDocument,
  };
};
