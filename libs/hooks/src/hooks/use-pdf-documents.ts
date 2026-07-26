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

  const { mutate: deleteDocument, error: deleteError } = useMutation({
    mutationFn: (id: string) => PdfDocumentsService.deleteDocument(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<PdfDocumentSummary[]>(pdfDocumentsQueryKey, (current) =>
        (current ?? []).filter((document) => document.id !== id),
      );
    },
  });

  return {
    documents: data ?? [],
    isLoading,
    error: deleteError ?? queryError,
    refetch,
    deleteDocument,
  };
};
