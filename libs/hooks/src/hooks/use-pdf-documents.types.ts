import type { PdfDocumentSummary, PdfDocumentsErrorCode } from '@helsoft/types';

export type UsePdfDocumentsResult = {
  documents: PdfDocumentSummary[];
  isLoading: boolean;
  error: PdfDocumentsErrorCode | null;
  refetch: () => void;
  deleteDocument: (id: string) => void;
};
