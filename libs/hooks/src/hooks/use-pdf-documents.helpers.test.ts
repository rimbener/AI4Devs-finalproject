import type { PdfDocumentsError } from '@helsoft/types';

import {
  isPdfDocumentsErrorShape,
  PDF_DOCUMENTS_ERROR_CODES,
  toPdfDocumentsErrorCode,
} from './use-pdf-documents.helpers';

describe('isPdfDocumentsErrorShape', () => {
  it.each([
    'network_error',
    'validation_error',
  ] as const)('returns true for a cause carrying code %s', (code) => {
    const cause: PdfDocumentsError = { code };

    expect(isPdfDocumentsErrorShape(cause)).toBe(true);
  });

  it('returns false for a cause with an unrecognized code', () => {
    expect(isPdfDocumentsErrorShape({ code: 'some_other_code' })).toBe(false);
  });

  it('returns false when cause has no code property', () => {
    expect(isPdfDocumentsErrorShape({})).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPdfDocumentsErrorShape(null)).toBe(false);
  });

  it('returns false for a raw Error instance', () => {
    expect(isPdfDocumentsErrorShape(new Error('boom'))).toBe(false);
  });
});

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
