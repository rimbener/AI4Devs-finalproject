jest.mock('../dao/pdf-upload.dao', () => ({
  PdfUploadDao: {
    uploadPdf: jest.fn(),
    insertDocument: jest.fn(),
    invokeExtraction: jest.fn(),
  },
}));

import { PdfUploadDao } from '../dao/pdf-upload.dao';
import { PdfUploadService } from './pdf-upload.service';

const dao = PdfUploadDao as jest.Mocked<typeof PdfUploadDao>;

describe('PdfUploadService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploadPdf delegates to PdfUploadDao.uploadPdf', async () => {
    const params = { userId: 'u1', documentId: 'd1', bytes: new Uint8Array([1]) };
    dao.uploadPdf.mockResolvedValue({ path: 'u1/d1/source.pdf' } as never);

    await expect(PdfUploadService.uploadPdf(params)).resolves.toEqual({
      path: 'u1/d1/source.pdf',
    });
    expect(dao.uploadPdf).toHaveBeenCalledWith(params);
  });

  it('insertDocument delegates to PdfUploadDao.insertDocument', async () => {
    const params = {
      documentId: 'd1',
      userId: 'u1',
      filename: 'a.pdf',
      sizeBytes: 10,
    };
    dao.insertDocument.mockResolvedValue({ id: 'd1' } as never);

    await expect(PdfUploadService.insertDocument(params)).resolves.toEqual({ id: 'd1' });
    expect(dao.insertDocument).toHaveBeenCalledWith(params);
  });

  it('invokeExtraction delegates to PdfUploadDao.invokeExtraction', async () => {
    const result = {
      documentId: 'd1',
      filename: 'a.pdf',
      pageCount: 1,
      imageCount: 0,
      pages: [],
      images: [],
    };
    dao.invokeExtraction.mockResolvedValue(result);

    await expect(PdfUploadService.invokeExtraction('d1')).resolves.toEqual(result);
    expect(dao.invokeExtraction).toHaveBeenCalledWith('d1');
  });
});
