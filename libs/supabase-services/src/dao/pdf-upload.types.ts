export type UploadPdfParams = {
  userId: string;
  documentId: string;
  bytes: Uint8Array;
};

export type InsertDocumentParams = {
  documentId: string;
  userId: string;
  filename: string;
  sizeBytes: number;
};

/** Raw Edge Function success payload for extract-pdf (service maps/validates). */
export type PdfUploadExtractionResult = {
  documentId: string;
  filename: string;
  pageCount: number;
  imageCount: number;
  pages: { page: number; text: string }[];
  images: unknown[];
};
