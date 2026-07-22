import { getSupabase } from '../supabase/supabase-client';

import type {
  InsertDocumentParams,
  PdfUploadExtractionResult,
  UploadPdfParams,
} from './pdf-upload.types';

const PDF_CONTENT_TYPE = 'application/pdf';
const EXTRACT_FUNCTION_NAME = 'extract-pdf';
const DOCUMENTS_TABLE = 'documents';
const PROCESSING_STATUS = 'processing';
/** Locked private bucket (spec decision #3); mirrored in pdf-upload-extraction constants. */
const PDF_UPLOAD_BUCKET = 'pdf-uploads';

const buildSourcePath = (userId: string, documentId: string): string =>
  `${userId}/${documentId}/source.pdf`;

/**
 * Raw Supabase data access for PDF upload: storage write, documents upsert, extract-pdf invoke.
 * No validation / error mapping — that lives in PdfExtractionService.
 */
export abstract class PdfUploadDao {
  static async uploadPdf({ userId, documentId, bytes }: UploadPdfParams) {
    const { data, error } = await getSupabase()
      .storage.from(PDF_UPLOAD_BUCKET)
      .upload(buildSourcePath(userId, documentId), bytes, {
        contentType: PDF_CONTENT_TYPE,
        upsert: true,
      });
    if (error) throw error;
    return data;
  }

  static async insertDocument({ documentId, userId, filename, sizeBytes }: InsertDocumentParams) {
    const { data, error } = await getSupabase()
      .from(DOCUMENTS_TABLE)
      .upsert({
        id: documentId,
        user_id: userId,
        filename,
        size_bytes: sizeBytes,
        status: PROCESSING_STATUS,
        error_code: null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async invokeExtraction(documentId: string): Promise<PdfUploadExtractionResult> {
    const { data, error } = await getSupabase().functions.invoke(EXTRACT_FUNCTION_NAME, {
      body: { documentId },
    });
    if (error) throw error;
    return data;
  }
}
