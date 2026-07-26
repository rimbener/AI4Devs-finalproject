jest.mock('@helsoft/supabase-services', () => ({
  PdfDocumentsService: { getDocuments: jest.fn(), deleteDocument: jest.fn() },
}));

import { PdfDocumentsService } from '@helsoft/supabase-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { pdfDocumentsQueryKey, usePdfDocuments } from './use-pdf-documents';

const service = PdfDocumentsService as jest.Mocked<typeof PdfDocumentsService>;

const createWrapper = (
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) => {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

const documents = [
  {
    id: 'doc-2',
    filename: 'newer.pdf',
    pageCount: 5,
    createdAt: '2026-07-14T12:00:00.000Z',
    status: 'ready' as const,
    lessonId: null,
  },
  {
    id: 'doc-1',
    filename: 'older.pdf',
    pageCount: 2,
    createdAt: '2026-07-13T12:00:00.000Z',
    status: 'failed' as const,
    lessonId: null,
  },
];

describe('usePdfDocuments', () => {
  beforeEach(() => jest.clearAllMocks());

  // Migration anchor — the hook must read/write through the shared TanStack cache under the
  // exported key, not a private useReducer slice.
  it('caches the loaded documents under pdfDocumentsQueryKey', async () => {
    service.getDocuments.mockResolvedValue(documents);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => usePdfDocuments(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(pdfDocumentsQueryKey)).toEqual(documents);
  });

  // @s17 — isLoading starts true before effects flush.
  it('initializes isLoading to true on the first render before effects flush', () => {
    const loadingOnRender: boolean[] = [];
    service.getDocuments.mockReturnValue(new Promise(() => {}) as never);

    renderHook(
      () => {
        const value = usePdfDocuments();
        loadingOnRender.push(value.isLoading);
        return value;
      },
      { wrapper: createWrapper() },
    );

    expect(loadingOnRender[0]).toBe(true);
  });

  // @s17 — the document list loads on mount with no error, once loading finishes.
  it('starts loading and resolves with documents from PdfDocumentsService.getDocuments', async () => {
    service.getDocuments.mockResolvedValue(documents);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.documents).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(service.getDocuments).toHaveBeenCalledTimes(1);
    expect(result.current.documents).toEqual(documents);
    expect(result.current.error).toBeNull();
  });

  // @s18 — a learner with no uploaded documents gets an empty list, not an error.
  it('resolves with an empty documents array when the service returns none', async () => {
    service.getDocuments.mockResolvedValue([]);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.documents).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  // @s19 — a failed list read exposes the error and an empty list.
  it('sets error and clears loading when the service rejects', async () => {
    const failure = new Error('PdfDocumentsService.getDocuments: failed to load documents');
    service.getDocuments.mockRejectedValue(failure);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.documents).toEqual([]);
  });

  // Reload without a prior error — pre-existing coverage, kept alongside s20's error-clearing case.
  it('refetch reloads documents from the service', async () => {
    const flipped = [
      {
        ...documents[0],
        status: 'generated' as const,
        lessonId: 'lesson-1',
      },
    ];
    service.getDocuments.mockResolvedValueOnce([]).mockResolvedValueOnce(flipped);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.documents).toEqual([]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.documents).toEqual(flipped));
    expect(service.getDocuments).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  // @s20 — refetching after a failed document read clears the error.
  it('refetch clears a prior error on success', async () => {
    service.getDocuments.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(documents);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.documents).toEqual(documents);
  });

  // @s21 — deleting a document removes it from the cached list without re-reading.
  it('deleteDocument removes the document from the list after a successful service delete, without re-reading', async () => {
    service.getDocuments.mockResolvedValue(documents);
    service.deleteDocument.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.documents).toEqual(documents);

    act(() => {
      result.current.deleteDocument('doc-2');
    });

    await waitFor(() => expect(service.deleteDocument).toHaveBeenCalledWith('doc-2'));
    await waitFor(() => expect(result.current.documents).toEqual([documents[1]]));
    expect(service.getDocuments).toHaveBeenCalledTimes(1);
  });

  // @s22 — a failed delete surfaces via error and leaves the list unchanged (mutate is void).
  it('deleteDocument leaves the list unchanged and sets error when the service rejects', async () => {
    const failure = new Error('PdfDocumentsService.deleteDocument: failed to delete document');
    service.getDocuments.mockResolvedValue(documents);
    service.deleteDocument.mockRejectedValue(failure);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.deleteDocument('doc-2');
    });

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.documents).toEqual(documents);
  });

  // @s23 — the delete error is cleared before the read starts, so a later read failure (not the
  // stale delete error) is what ends up exposed.
  it('clears the delete error before refetching, exposing a later read failure instead', async () => {
    const deleteFailure = new Error(
      'PdfDocumentsService.deleteDocument: failed to delete document',
    );
    const readFailure = new Error('PdfDocumentsService.getDocuments: failed to load documents');
    service.getDocuments.mockResolvedValueOnce(documents).mockRejectedValueOnce(readFailure);
    service.deleteDocument.mockRejectedValue(deleteFailure);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.deleteDocument('doc-2');
    });
    await waitFor(() => expect(result.current.error).toBe(deleteFailure));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBe(readFailure));
    expect(service.getDocuments).toHaveBeenCalledTimes(2);
    expect(result.current.documents).toEqual(documents);
  });

  // @s23 — a refetch that succeeds after a failed delete clears the delete error entirely.
  it('clears a prior delete error once a refetch succeeds', async () => {
    const deleteFailure = new Error(
      'PdfDocumentsService.deleteDocument: failed to delete document',
    );
    service.getDocuments.mockResolvedValue(documents);
    service.deleteDocument.mockRejectedValue(deleteFailure);
    const { result } = renderHook(() => usePdfDocuments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.deleteDocument('doc-2');
    });
    await waitFor(() => expect(result.current.error).toBe(deleteFailure));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.documents).toEqual(documents);
  });
});
