import type { PdfDocumentsErrorCode } from '@helsoft/types';

import { toErrorCode } from './error-code.helpers';

export const PDF_DOCUMENTS_ERROR_CODES: ReadonlySet<PdfDocumentsErrorCode> = new Set([
  'network_error',
  'validation_error',
]);

export const toPdfDocumentsErrorCode = (cause: unknown): PdfDocumentsErrorCode =>
  toErrorCode(PDF_DOCUMENTS_ERROR_CODES, cause, 'network_error');
