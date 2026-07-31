import { trackPdfExtractionEvent } from './pdf-extraction-analytics';

describe('trackPdfExtractionEvent', () => {
  it('is a no-op that returns undefined for pdf_upload_started', () => {
    expect(
      trackPdfExtractionEvent({
        name: 'pdf_upload_started',
        properties: { size_bytes: 1024, document_id: 'doc-1' },
      }),
    ).toBeUndefined();
  });

  it('is a no-op that returns undefined for pdf_extraction_succeeded', () => {
    expect(
      trackPdfExtractionEvent({
        name: 'pdf_extraction_succeeded',
        properties: {
          document_id: 'doc-1',
          page_count: 5,
          image_count: 2,
          duration_ms: 1200,
        },
      }),
    ).toBeUndefined();
  });

  it('is a no-op that returns undefined for pdf_extraction_failed with a document_id', () => {
    expect(
      trackPdfExtractionEvent({
        name: 'pdf_extraction_failed',
        properties: { document_id: 'doc-1', error_code: 'extraction_failed', stage: 'server' },
      }),
    ).toBeUndefined();
  });

  it('is a no-op that returns undefined for pdf_extraction_failed without a document_id', () => {
    expect(
      trackPdfExtractionEvent({
        name: 'pdf_extraction_failed',
        properties: { error_code: 'unsupported_file_type', stage: 'client' },
      }),
    ).toBeUndefined();
  });

  it('does not throw when invoked', () => {
    expect(() =>
      trackPdfExtractionEvent({
        name: 'pdf_upload_started',
        properties: { size_bytes: 0, document_id: 'doc-1' },
      }),
    ).not.toThrow();
  });
});
