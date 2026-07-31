import type { PdfDocumentsError, PdfDocumentsErrorCode } from '@helsoft/types';

export const PDF_DOCUMENTS_ERROR_CODES: ReadonlySet<PdfDocumentsErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

export const isPdfDocumentsErrorShape = (cause: unknown): cause is PdfDocumentsError =>
  PDF_DOCUMENTS_ERROR_CODES.has(
    (cause as { code?: unknown } | null)?.code as PdfDocumentsErrorCode,
  );

export const toPdfDocumentsErrorCode = (cause: unknown): PdfDocumentsErrorCode =>
  isPdfDocumentsErrorShape(cause) ? cause.code : 'network_error';
