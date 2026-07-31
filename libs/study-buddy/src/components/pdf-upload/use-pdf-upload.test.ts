jest.mock('@helsoft/pdf-upload-extraction', () => ({
  ...jest.requireActual('@helsoft/pdf-upload-extraction'),
  usePdfExtraction: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: jest.fn() })),
}));

import { useLocalization } from '@helsoft/localization';
import { PDF_EXTRACTION_LIMITS, usePdfExtraction } from '@helsoft/pdf-upload-extraction';
import { act, renderHook } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { usePdfUpload } from './use-pdf-upload';

const mockUsePdfExtraction = usePdfExtraction as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const MockFile = File as unknown as jest.Mock;

const extractionValue = (overrides: Partial<ReturnType<typeof usePdfExtraction>> = {}) => ({
  extract: jest.fn(),
  stage: 'idle' as const,
  result: null,
  error: null,
  retry: jest.fn(),
  reset: jest.fn(),
  ...overrides,
});

describe('usePdfUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUsePdfExtraction.mockReturnValue(extractionValue());
  });

  it('reads a web-picked file via its Blob and calls extract with filename, size, and bytes', async () => {
    const extract = jest.fn().mockResolvedValue(undefined);
    mockUsePdfExtraction.mockReturnValue(extractionValue({ extract }));
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'notes.pdf',
          size: 3,
          uri: 'blob:notes',
          file: { arrayBuffer: () => Promise.resolve(bytes) },
        },
      ],
    });

    const { result } = await renderHook(() => usePdfUpload());
    await act(async () => {
      await result.current.chooseFile();
    });

    expect(mockGetDocumentAsync).toHaveBeenCalledWith({ type: 'application/pdf' });
    expect(extract).toHaveBeenCalledWith({
      filename: 'notes.pdf',
      sizeBytes: 3,
      bytes: new Uint8Array(bytes),
    });
  });

  it('reads a native-picked file via expo-file-system when no Blob is available', async () => {
    const extract = jest.fn().mockResolvedValue(undefined);
    mockUsePdfExtraction.mockReturnValue(extractionValue({ extract }));
    const bytes = new Uint8Array([4, 5, 6]).buffer;
    MockFile.mockImplementation(() => ({ arrayBuffer: () => Promise.resolve(bytes) }));
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'native.pdf', size: 3, uri: 'file:///tmp/native.pdf' }],
    });

    const { result } = await renderHook(() => usePdfUpload());
    await act(async () => {
      await result.current.chooseFile();
    });

    expect(MockFile).toHaveBeenCalledWith('file:///tmp/native.pdf');
    expect(extract).toHaveBeenCalledWith({
      filename: 'native.pdf',
      sizeBytes: 3,
      bytes: new Uint8Array(bytes),
    });
  });

  it('falls back to the read byte length when the picked asset reports no size', async () => {
    const extract = jest.fn().mockResolvedValue(undefined);
    mockUsePdfExtraction.mockReturnValue(extractionValue({ extract }));
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'notes.pdf',
          size: null,
          uri: 'blob:notes',
          file: { arrayBuffer: () => Promise.resolve(bytes) },
        },
      ],
    });

    const { result } = await renderHook(() => usePdfUpload());
    await act(async () => {
      await result.current.chooseFile();
    });

    expect(extract).toHaveBeenCalledWith({
      filename: 'notes.pdf',
      sizeBytes: 4,
      bytes: new Uint8Array(bytes),
    });
  });

  it('does not call extract when the picker is canceled', async () => {
    const extract = jest.fn();
    mockUsePdfExtraction.mockReturnValue(extractionValue({ extract }));
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    const { result } = await renderHook(() => usePdfUpload());
    await act(async () => {
      await result.current.chooseFile();
    });

    expect(extract).not.toHaveBeenCalled();
  });

  it.each([
    ['idle', 'idle'],
    ['processing', 'loading'],
    ['success', 'content'],
    ['error', 'error'],
  ] as const)('maps extraction stage %s to panel state %s', async (stage, panelState) => {
    mockUsePdfExtraction.mockReturnValue(extractionValue({ stage }));

    const { result } = await renderHook(() => usePdfUpload());

    expect(result.current.panelProps.state).toBe(panelState);
  });

  it('surfaces the extracted result fields, image-count announcement, and live extraction limits in panelProps', async () => {
    const t = jest.fn((key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    );
    mockUseLocalization.mockReturnValue(localizationValue({ t }));
    mockUsePdfExtraction.mockReturnValue(
      extractionValue({
        stage: 'success',
        result: {
          documentId: 'd1',
          filename: 'notes.pdf',
          pageCount: 4,
          imageCount: 2,
          pages: [],
          images: [],
        },
      }),
    );

    const { result } = await renderHook(() => usePdfUpload());

    expect(result.current.panelProps.filename).toBe('notes.pdf');
    expect(result.current.panelProps.pageCount).toBe(4);
    expect(result.current.panelProps.imageCount).toBe(2);
    expect(t).toHaveBeenCalledWith('upload.imageCount', { count: 2 });
    expect(result.current.panelProps.maxMb).toBe(
      PDF_EXTRACTION_LIMITS.maxSizeBytes / (1024 * 1024),
    );
    expect(result.current.panelProps.maxPages).toBe(PDF_EXTRACTION_LIMITS.maxPages);
  });

  it('leaves filename/pageCount/imageCount/imageCountAnnouncement undefined when there is no result yet', async () => {
    mockUsePdfExtraction.mockReturnValue(extractionValue({ stage: 'idle', result: null }));

    const { result } = await renderHook(() => usePdfUpload());

    expect(result.current.panelProps.filename).toBeUndefined();
    expect(result.current.panelProps.pageCount).toBeUndefined();
    expect(result.current.panelProps.imageCount).toBeUndefined();
    expect(result.current.panelProps.imageCountAnnouncement).toBeUndefined();
  });

  it.each([
    ['network_error', 'error.network'],
    ['extraction_failed', 'upload.error.extractionFailed'],
    ['unauthenticated', 'upload.error.unauthenticated'],
  ] as const)('maps error code %s to its message key %s and computes canRetry', async (code, key) => {
    mockUsePdfExtraction.mockReturnValue(extractionValue({ stage: 'error', error: code }));

    const { result } = await renderHook(() => usePdfUpload());

    expect(result.current.panelProps.errorMessage).toBe(key);
    expect(result.current.panelProps.canRetry).toBe(
      code === 'network_error' || code === 'extraction_failed',
    );
  });

  it('leaves errorMessage undefined and canRetry true when there is no error', async () => {
    mockUsePdfExtraction.mockReturnValue(extractionValue({ stage: 'idle', error: null }));

    const { result } = await renderHook(() => usePdfUpload());

    expect(result.current.panelProps.errorMessage).toBeUndefined();
    expect(result.current.panelProps.canRetry).toBe(true);
  });

  it('exposes the underlying retry from usePdfExtraction as both retry and onRetry', async () => {
    const retry = jest.fn();
    mockUsePdfExtraction.mockReturnValue(extractionValue({ retry }));

    const { result } = await renderHook(() => usePdfUpload());
    await act(async () => {
      result.current.panelProps.onRetry();
    });

    expect(retry).toHaveBeenCalledTimes(1);
    expect(result.current.retry).toBe(retry);
  });

  describe('onExtracted', () => {
    const successResult = {
      documentId: 'doc-1',
      filename: 'notes.pdf',
      pageCount: 4,
      imageCount: 0,
      pages: [],
      images: [],
    };

    it('fires onExtracted once with the extracted documentId once stage becomes success', async () => {
      const onExtracted = jest.fn();
      mockUsePdfExtraction.mockReturnValue(extractionValue({ stage: 'idle', result: null }));
      const { rerender } = await renderHook(() => usePdfUpload({ onExtracted }));

      expect(onExtracted).not.toHaveBeenCalled();

      mockUsePdfExtraction.mockReturnValue(
        extractionValue({ stage: 'success', result: successResult }),
      );
      await rerender(undefined);

      expect(onExtracted).toHaveBeenCalledTimes(1);
      expect(onExtracted).toHaveBeenCalledWith('doc-1');
    });

    it('does not re-fire onExtracted on a re-render with the same documentId', async () => {
      const onExtracted = jest.fn();
      mockUsePdfExtraction.mockReturnValue(
        extractionValue({ stage: 'success', result: successResult }),
      );
      const { rerender } = await renderHook(() => usePdfUpload({ onExtracted }));
      expect(onExtracted).toHaveBeenCalledTimes(1);

      await rerender(undefined);

      expect(onExtracted).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onExtracted is omitted and stage is success', async () => {
      mockUsePdfExtraction.mockReturnValue(
        extractionValue({ stage: 'success', result: successResult }),
      );

      await expect(renderHook(() => usePdfUpload())).resolves.toBeTruthy();
    });
  });

  it('resetUpload clears the announced-document guard and calls the extraction reset', async () => {
    const reset = jest.fn();
    const onExtracted = jest.fn();
    const successResult = {
      documentId: 'd1',
      filename: 'a.pdf',
      pageCount: 1,
      imageCount: 0,
      pages: [],
      images: [],
    };
    mockUsePdfExtraction.mockReturnValue(
      extractionValue({ stage: 'success', reset, result: successResult }),
    );
    const { result, rerender } = await renderHook(() => usePdfUpload({ onExtracted }));
    expect(onExtracted).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.resetUpload();
    });
    expect(reset).toHaveBeenCalledTimes(1);

    // Simulate the extraction going back to idle (as the real reset() would drive it) and then
    // re-extracting the *same* document — without resetUpload clearing the guard ref, the second
    // success for 'd1' would be silently swallowed as an already-announced documentId.
    mockUsePdfExtraction.mockReturnValue(extractionValue({ stage: 'idle', reset, result: null }));
    await rerender(undefined);
    mockUsePdfExtraction.mockReturnValue(
      extractionValue({ stage: 'success', reset, result: successResult }),
    );
    await rerender(undefined);

    expect(onExtracted).toHaveBeenCalledTimes(2);
  });

  it('keeps chooseFile and resetUpload referentially stable across re-renders with unchanged deps', async () => {
    const { result, rerender } = await renderHook(() => usePdfUpload());

    const firstChooseFile = result.current.chooseFile;
    const firstResetUpload = result.current.resetUpload;

    await rerender(undefined);

    expect(result.current.chooseFile).toBe(firstChooseFile);
    expect(result.current.resetUpload).toBe(firstResetUpload);
  });
});
