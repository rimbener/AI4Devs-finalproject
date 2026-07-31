/**
 * Normalized outcome codes for `PdfDocumentsService` failures. The service maps every DAO/network
 * failure onto one of these so the UI never branches on raw Supabase shapes — message copy is
 * deliberately not part of this contract (UI maps `code` → i18n).
 */
export type PdfDocumentsErrorCode = 'network_error' | 'validation_error';

/** Minimal shape a normalized PDF-documents failure carries upward from the service layer. */
export type PdfDocumentsError = {
  code: PdfDocumentsErrorCode;
};
