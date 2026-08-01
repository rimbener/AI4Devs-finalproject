import { PDF_DOCUMENTS_ERROR_CODES, toPdfDocumentsErrorCode } from './use-pdf-documents.helpers';

describe('PDF_DOCUMENTS_ERROR_CODES', () => {
  it('contains exactly the two normalized pdf-documents error codes', () => {
    expect(PDF_DOCUMENTS_ERROR_CODES).toEqual(new Set(['network_error', 'validation_error']));
  });
});

describe('toPdfDocumentsErrorCode', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('passes through code %s when cause has PdfDocumentsError shape', (code) => {
    expect(toPdfDocumentsErrorCode({ code })).toBe(code);
  });

  it('falls back to network_error for a raw Error instance', () => {
    expect(toPdfDocumentsErrorCode(new Error('boom'))).toBe('network_error');
  });

  it('falls back to network_error for null', () => {
    expect(toPdfDocumentsErrorCode(null)).toBe('network_error');
  });
});
