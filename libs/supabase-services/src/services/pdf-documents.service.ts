import type {
  PdfDocumentStatus,
  PdfDocumentSummary,
  PdfDocumentsError,
  PdfDocumentsErrorCode,
} from '@helsoft/types';

import { PdfDocumentsDao } from '../dao/pdf-documents.dao';
import type { UserDocumentRow } from '../dao/pdf-documents.types';
import { toTypedError } from '../utils/typed-error';

const deriveStatus = (row: UserDocumentRow): PdfDocumentStatus => {
  if (row.lesson_id) return 'generated';
  if (row.generation_error_code) return 'failed';
  return 'ready';
};

const toPdfDocumentSummary = (row: UserDocumentRow): PdfDocumentSummary => {
  const status = deriveStatus(row);
  return {
    id: row.id,
    filename: row.filename,
    pageCount: row.page_count,
    createdAt: row.created_at,
    status,
    lessonId: status === 'generated' ? row.lesson_id : null,
  };
};

const toPdfDocumentsError = (
  code: PdfDocumentsErrorCode,
  message: string,
): Error & PdfDocumentsError => toTypedError(code, message);

/**
 * Business logic over PdfDocumentsDao: validates inputs, derives list status, normalizes failures.
 */
export abstract class PdfDocumentsService {
  static async getDocuments(): Promise<PdfDocumentSummary[]> {
    try {
      const rows = await PdfDocumentsDao.getDocuments();
      return rows.map(toPdfDocumentSummary);
    } catch {
      throw toPdfDocumentsError(
        'network_error',
        'PdfDocumentsService.getDocuments: failed to load documents',
      );
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    if (!id.trim()) {
      return Promise.reject(
        toPdfDocumentsError(
          'validation_error',
          'PdfDocumentsService.deleteDocument: id must not be empty',
        ),
      );
    }
    try {
      await PdfDocumentsDao.deleteDocument(id);
    } catch {
      throw toPdfDocumentsError(
        'network_error',
        'PdfDocumentsService.deleteDocument: failed to delete document',
      );
    }
  }
}
