import { PdfUploadDao } from '../dao/pdf-upload.dao';
import type {
  InsertDocumentParams,
  PdfUploadExtractionResult,
  UploadPdfParams,
} from '../dao/pdf-upload.types';

/**
 * Service over PdfUploadDao — public entry for upload/insert/extract so feature libs never
 * import a DAO (`hooks-service-dao.mdc` package-boundary).
 */
export abstract class PdfUploadService {
  static uploadPdf(params: UploadPdfParams) {
    return PdfUploadDao.uploadPdf(params);
  }

  static insertDocument(params: InsertDocumentParams) {
    return PdfUploadDao.insertDocument(params);
  }

  static invokeExtraction(documentId: string): Promise<PdfUploadExtractionResult> {
    return PdfUploadDao.invokeExtraction(documentId);
  }
}
