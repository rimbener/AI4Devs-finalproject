jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import type { PdfDocumentListState } from './pdf-document-list.types';
import { usePdfDocumentList } from './use-pdf-document-list';

const mockUseLocalization = useLocalization as jest.Mock;

describe('usePdfDocumentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
  });

  it('starts with pendingDeleteId null', async () => {
    const { result } = await renderHook(() => usePdfDocumentList({ state: 'content' }));

    expect(result.current.pendingDeleteId).toBeNull();
  });

  it('setPendingDeleteId updates the pending delete id', async () => {
    const { result } = await renderHook(() => usePdfDocumentList({ state: 'content' }));

    await act(async () => {
      result.current.setPendingDeleteId('doc-1');
    });

    expect(result.current.pendingDeleteId).toBe('doc-1');
  });

  it.each([
    ['loading', 'pdfList.loading'],
    ['empty', 'pdfList.empty'],
    ['error', 'pdfList.error'],
  ] as const)('announces %s state via AccessibilityInfo with %s', async (state, key) => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    await renderHook(() => usePdfDocumentList({ state }));

    expect(announceSpy).toHaveBeenCalledWith(key);
    announceSpy.mockRestore();
  });

  it('does not announce anything when state is content', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    await renderHook(() => usePdfDocumentList({ state: 'content' }));

    expect(announceSpy).not.toHaveBeenCalled();
    announceSpy.mockRestore();
  });

  it('re-announces when state changes across a re-render', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    const { rerender } = await renderHook(
      ({ state }: { state: PdfDocumentListState }) => usePdfDocumentList({ state }),
      { initialProps: { state: 'loading' as const } },
    );
    expect(announceSpy).toHaveBeenCalledWith('pdfList.loading');

    announceSpy.mockClear();
    await rerender({ state: 'error' as const });
    expect(announceSpy).toHaveBeenCalledWith('pdfList.error');

    announceSpy.mockRestore();
  });

  it('does not re-announce when re-rendered with the same state', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    const { rerender } = await renderHook(
      ({ state }: { state: PdfDocumentListState }) => usePdfDocumentList({ state }),
      { initialProps: { state: 'loading' as const } },
    );
    expect(announceSpy).toHaveBeenCalledTimes(1);

    announceSpy.mockClear();
    await rerender({ state: 'loading' as const });
    expect(announceSpy).not.toHaveBeenCalled();

    announceSpy.mockRestore();
  });
});
