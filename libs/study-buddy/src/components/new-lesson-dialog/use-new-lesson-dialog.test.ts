jest.mock('../pdf-upload/use-pdf-upload', () => ({
  usePdfUpload: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react-native';

import { usePdfUpload } from '../pdf-upload/use-pdf-upload';
import type { NewLessonDialogProps } from './new-lesson-dialog.types';
import { useNewLessonDialog } from './use-new-lesson-dialog';

const mockUsePdfUpload = usePdfUpload as jest.Mock;

type HookProps = Pick<
  NewLessonDialogProps,
  'onExtracted' | 'generateDocumentId' | 'onGenerateHandled'
>;

const pdfUploadValue = () => ({
  chooseFile: jest.fn(),
  resetUpload: jest.fn(),
  panelProps: { state: 'idle' as const },
});

describe('useNewLessonDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePdfUpload.mockReturnValue(pdfUploadValue());
  });

  it('starts closed on the upload step with no documentId', async () => {
    const { result } = await renderHook(() => useNewLessonDialog({}));

    expect(result.current.open).toBe(false);
    expect(result.current.step).toBe('upload');
    expect(result.current.documentId).toBeUndefined();
  });

  it('exposes chooseFile/panelProps/resetUpload straight from usePdfUpload', async () => {
    const uploadValue = pdfUploadValue();
    mockUsePdfUpload.mockReturnValue(uploadValue);

    const { result } = await renderHook(() => useNewLessonDialog({}));

    expect(result.current.chooseFile).toBe(uploadValue.chooseFile);
    expect(result.current.panelProps).toBe(uploadValue.panelProps);
    expect(result.current.resetUpload).toBe(uploadValue.resetUpload);
  });

  it('openUpload opens the dialog on the upload step', async () => {
    const { result } = await renderHook(() => useNewLessonDialog({}));

    await act(async () => {
      result.current.openUpload();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.step).toBe('upload');
  });

  it('close closes the dialog without resetting step/documentId', async () => {
    const { result } = await renderHook(() => useNewLessonDialog({}));

    await act(async () => {
      result.current.openUpload();
    });
    await act(async () => {
      result.current.close();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.step).toBe('upload');
  });

  it('the onExtracted handler passed to usePdfUpload advances to the generate step and notifies the caller', async () => {
    const onExtracted = jest.fn();
    const { result } = await renderHook(() => useNewLessonDialog({ onExtracted }));

    const handleExtracted = mockUsePdfUpload.mock.calls[0][0].onExtracted;

    await act(async () => {
      handleExtracted('doc-1');
    });

    expect(result.current.step).toBe('generate');
    expect(result.current.documentId).toBe('doc-1');
    expect(onExtracted).toHaveBeenCalledWith('doc-1');
  });

  it('the onExtracted handler works without an onExtracted callback', async () => {
    const { result } = await renderHook(() => useNewLessonDialog({}));

    const handleExtracted = mockUsePdfUpload.mock.calls[0][0].onExtracted;

    await act(async () => {
      handleExtracted('doc-2');
    });

    expect(result.current.documentId).toBe('doc-2');
  });

  it('opens on the generate step when generateDocumentId is provided and calls onGenerateHandled once', async () => {
    const onGenerateHandled = jest.fn();
    const { result, rerender } = await renderHook((props: HookProps) => useNewLessonDialog(props), {
      initialProps: { generateDocumentId: undefined, onGenerateHandled },
    });

    await act(async () => {
      await rerender({ generateDocumentId: 'doc-3', onGenerateHandled });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.step).toBe('generate');
    expect(result.current.documentId).toBe('doc-3');
    expect(onGenerateHandled).toHaveBeenCalledTimes(1);
  });

  it('does not re-fire the generate effect when generateDocumentId is unchanged across a rerender', async () => {
    const onGenerateHandled = jest.fn();
    const { rerender } = await renderHook((props: HookProps) => useNewLessonDialog(props), {
      initialProps: { generateDocumentId: 'doc-4', onGenerateHandled },
    });

    await act(async () => {
      await rerender({ generateDocumentId: 'doc-4', onGenerateHandled });
    });

    expect(onGenerateHandled).toHaveBeenCalledTimes(1);
  });
});
