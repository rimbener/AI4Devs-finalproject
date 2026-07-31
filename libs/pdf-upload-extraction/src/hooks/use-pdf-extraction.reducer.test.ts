import type { PdfExtractionResult } from '../types/pdf-extraction.types';
import {
  usePdfExtractionInitialState,
  usePdfExtractionReducer,
} from './use-pdf-extraction.reducer';

const extractionResult: PdfExtractionResult = {
  documentId: 'doc-1',
  filename: 'notes.pdf',
  pageCount: 2,
  imageCount: 0,
  pages: [
    { page: 1, text: 'Page one text.' },
    { page: 2, text: 'Page two text.' },
  ],
  images: [],
};

describe('usePdfExtractionReducer', () => {
  it('moves to processing on extract/start, clearing error but preserving prior result', () => {
    const state = { ...usePdfExtractionInitialState, result: extractionResult };

    expect(usePdfExtractionReducer(state, { type: 'extract/start' })).toEqual({
      stage: 'processing',
      result: extractionResult,
      error: null,
    });
  });

  it('moves to success with the result on extract/success', () => {
    const state = { ...usePdfExtractionInitialState, stage: 'processing' as const };

    expect(
      usePdfExtractionReducer(state, { type: 'extract/success', result: extractionResult }),
    ).toEqual({ stage: 'success', result: extractionResult, error: null });
  });

  it('moves to error on extract/failure, preserving prior result', () => {
    const state = {
      stage: 'processing' as const,
      result: extractionResult,
      error: null,
    };

    expect(
      usePdfExtractionReducer(state, { type: 'extract/failure', error: 'extraction_failed' }),
    ).toEqual({ stage: 'error', result: extractionResult, error: 'extraction_failed' });
  });

  it('resets back to the initial state on extract/reset', () => {
    const state = {
      stage: 'error' as const,
      result: extractionResult,
      error: 'extraction_failed' as const,
    };

    expect(usePdfExtractionReducer(state, { type: 'extract/reset' })).toEqual(
      usePdfExtractionInitialState,
    );
  });
});
