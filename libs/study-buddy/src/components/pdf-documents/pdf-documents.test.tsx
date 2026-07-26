jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  usePdfDocuments: jest.fn(),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../new-lesson-dialog/new-lesson-dialog', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    NewLessonDialog: ({
      generateDocumentId,
      onExtracted,
      onGenerated,
    }: {
      generateDocumentId?: string;
      onExtracted?: () => void;
      onGenerated?: () => void;
    }) =>
      React.createElement(
        React.Fragment,
        null,
        generateDocumentId ? React.createElement(Text, null, `gen:${generateDocumentId}`) : null,
        React.createElement(
          Pressable,
          { accessibilityRole: 'button', onPress: () => onExtracted?.() },
          React.createElement(Text, null, 'sim-extract'),
        ),
        React.createElement(
          Pressable,
          { accessibilityRole: 'button', onPress: () => onGenerated?.() },
          React.createElement(Text, null, 'sim-generated'),
        ),
      ),
  };
});

/** Capture list props so mutation tests can invoke onOpenLesson with a missing id. */
const capturedListProps: {
  current?: { onOpenLesson: (id: string) => void };
} = {};
jest.mock('@helsoft/components', () => {
  const actual = jest.requireActual('@helsoft/components') as typeof import('@helsoft/components');
  return {
    ...actual,
    PdfDocumentList: (props: Parameters<typeof actual.PdfDocumentList>[0]) => {
      capturedListProps.current = props;
      return actual.PdfDocumentList(props);
    },
  };
});

import { usePdfDocuments, useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { PdfDocuments } from './pdf-documents';

const mockUsePdfDocuments = usePdfDocuments as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'pdfList.heading') return 'Your PDFs';
  if (key === 'pdfList.loading') return 'Loading your PDFs…';
  if (key === 'pdfList.empty') return 'No extracted PDFs yet. Upload one to get started.';
  if (key === 'pdfList.error') return "We couldn't load your PDFs.";
  if (key === 'pdfList.retry') return 'Try again';
  if (key === 'pdfList.status.ready') return 'Ready to generate';
  if (key === 'pdfList.status.failed') return 'Generation failed';
  if (key === 'pdfList.status.generated') return 'Lesson ready';
  if (key === 'pdfList.action.generate') return 'Generate';
  if (key === 'pdfList.action.retry') return 'Retry';
  if (key === 'pdfList.action.openLesson') return 'Open lesson';
  if (key === 'pdfList.action.generateA11y') return `Generate ${options?.filename}`;
  if (key === 'pdfList.action.retryA11y') return `Retry ${options?.filename}`;
  if (key === 'pdfList.action.openLessonA11y') return `Open lesson for ${options?.filename}`;
  if (key === 'pdfList.createdDate') return String(options?.date ?? '');
  if (key === 'pdfList.pageCount') return `${options?.count} pages`;
  if (key === 'pdfList.delete.action') return `Delete ${options?.filename}`;
  if (key === 'pdfList.delete.confirmHeadline') return 'Delete this PDF?';
  if (key === 'pdfList.delete.confirmBody') {
    return 'This permanently removes the PDF and its extracted data.';
  }
  if (key === 'pdfList.delete.confirmAction') return 'Delete';
  if (key === 'pdfList.delete.cancelAction') return 'Cancel';
  if (key === 'pdfList.delete.failed') return "We couldn't delete that PDF.";
  return key;
};

const docsValue = (overrides: Partial<ReturnType<typeof usePdfDocuments>> = {}) => ({
  documents: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  deleteDocument: jest.fn(),
  ...overrides,
});

const profileValue = (canCreate = true) => ({
  profile: canCreate
    ? {
        plan: 'paid' as const,
        keySource: 'platform' as const,
        showKeySettings: false,
        showAds: false,
        canCreate: true,
      }
    : {
        plan: 'free' as const,
        keySource: 'user' as const,
        showKeySettings: true,
        showAds: true,
        canCreate: false,
      },
  isLoading: false,
  error: null,
  retry: jest.fn(),
});

describe('PdfDocuments', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue({ t, locale: 'en' }));
    mockUseProfile.mockReturnValue(profileValue(true));
    mockUseRouter.mockReturnValue({ push });
  });

  // @s15 — loading.
  it('shows the loading indicator while documents are loading', async () => {
    mockUsePdfDocuments.mockReturnValue(docsValue({ isLoading: true }));

    await render(<PdfDocuments />);

    expect(screen.getByTestId('pdf-document-list-loading-indicator')).toBeTruthy();
    expect(screen.getByText('Loading your PDFs…')).toBeTruthy();
  });

  // @s14 — empty.
  it('shows the empty state when there are no documents', async () => {
    mockUsePdfDocuments.mockReturnValue(docsValue());

    await render(<PdfDocuments />);

    expect(screen.getByText('No extracted PDFs yet. Upload one to get started.')).toBeTruthy();
  });

  // @s1/@s2/@s3/@s4 — content rows with status labels.
  it('renders document filenames and status labels from usePdfDocuments', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-1',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
          {
            id: 'doc-2',
            filename: 'failed.pdf',
            pageCount: 4,
            createdAt: '2026-07-12T12:00:00.000Z',
            status: 'failed',
            lessonId: null,
          },
          {
            id: 'doc-3',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-9',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);

    expect(screen.getByText('Your PDFs')).toBeTruthy();
    expect(screen.getByText('notes.pdf')).toBeTruthy();
    expect(screen.getByText('Ready to generate')).toBeTruthy();
    expect(screen.getByText('Generation failed')).toBeTruthy();
    expect(screen.getByText('Lesson ready')).toBeTruthy();
    expect(screen.getByText(/Jul(y)?\s*13,?\s*2026/)).toBeTruthy();
  });

  // @s5 — Generate raises onGenerate(documentId).
  it('raises onGenerate with the document id when Generate is pressed', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Generate notes.pdf' }));
    });

    expect(screen.getByText('gen:doc-ready')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  // @s6 — Retry raises onGenerate(documentId).
  it('raises onGenerate with the document id when Retry is pressed', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-failed',
            filename: 'failed.pdf',
            pageCount: 4,
            createdAt: '2026-07-12T12:00:00.000Z',
            status: 'failed',
            lessonId: null,
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Retry failed.pdf' }));
    });

    expect(screen.getByText('gen:doc-failed')).toBeTruthy();
  });

  // @s7 — Open lesson raises onOpenLesson(lessonId), not document id.
  it('raises onOpenLesson with the lesson id when Open lesson is pressed', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-42',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    fireEvent.press(screen.getByRole('button', { name: 'Open lesson for done.pdf' }));

    expect(push).toHaveBeenCalledWith({
      pathname: '/lesson/[id]/player',
      params: { id: 'lesson-42' },
    });
  });

  // @s13 — disabling creation keeps existing generated lessons openable.
  it('hides Generate while preserving Open lesson when canCreate is false', async () => {
    mockUseProfile.mockReturnValue(profileValue(false));
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-42',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);

    expect(screen.queryByRole('button', { name: 'Generate notes.pdf' })).toBeNull();
    expect(screen.queryByText('sim-extract')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Open lesson for done.pdf' }));
    expect(push).toHaveBeenCalledWith({
      pathname: '/lesson/[id]/player',
      params: { id: 'lesson-42' },
    });
  });

  // @s16 — error + retry wired to refetch.
  it('shows error copy and retries via refetch', async () => {
    const refetch = jest.fn();
    mockUsePdfDocuments.mockReturnValue(docsValue({ error: new Error('network'), refetch }));

    await render(<PdfDocuments />);

    expect(screen.getByText("We couldn't load your PDFs.")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // @s12 — confirm delete calls deleteDocument.
  it('calls deleteDocument when delete is confirmed', async () => {
    const deleteDocument = jest.fn();
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        deleteDocument,
      }),
    );

    await render(<PdfDocuments />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete notes.pdf' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    });

    expect(deleteDocument).toHaveBeenCalledWith('doc-ready');
  });

  // @s13 — dismiss keeps the document.
  it('does not call deleteDocument when the confirmation is dismissed', async () => {
    const deleteDocument = jest.fn();
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        deleteDocument,
      }),
    );

    await render(<PdfDocuments />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete notes.pdf' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(deleteDocument).not.toHaveBeenCalled();
  });

  // @s11 — generated rows offer no delete.
  it('does not offer delete for generated documents', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-1',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);

    expect(screen.queryByRole('button', { name: 'Delete done.pdf' })).toBeNull();
  });

  // @s9/@s10 — extract/generate success refetches the list via NewLessonDialog.
  it('calls refetch when NewLessonDialog reports extract success', async () => {
    const refetch = jest.fn();
    mockUsePdfDocuments.mockReturnValue(docsValue({ refetch }));

    await render(<PdfDocuments />);
    expect(refetch).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'sim-extract' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('calls refetch when NewLessonDialog reports generate success', async () => {
    const refetch = jest.fn();
    mockUsePdfDocuments.mockReturnValue(docsValue({ refetch }));

    await render(<PdfDocuments />);
    fireEvent.press(screen.getByRole('button', { name: 'sim-generated' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // Mutation: drop `.trim()` / `if (!lessonId)` / find predicate / optional chaining.
  it('does not open a lesson when lessonId is whitespace-only', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: '   ',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    fireEvent.press(screen.getByRole('button', { name: 'Open lesson for done.pdf' }));

    expect(push).not.toHaveBeenCalled();
  });

  // Mutation: `?.lessonId.trim()` without optional on lessonId — null must not throw.
  it('does not throw when a generated row has a null lessonId', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: null,
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    expect(() => {
      fireEvent.press(screen.getByRole('button', { name: 'Open lesson for done.pdf' }));
    }).not.toThrow();
    expect(push).not.toHaveBeenCalled();
  });

  it('does not throw when Open lesson is pressed for an unknown document id', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-1',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    expect(() => {
      capturedListProps.current?.onOpenLesson('missing-id');
    }).not.toThrow();
    expect(push).not.toHaveBeenCalled();
  });

  it('opens the lessonId of the pressed row, not the first document', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-a',
            filename: 'first.pdf',
            pageCount: 1,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-a',
          },
          {
            id: 'doc-b',
            filename: 'second.pdf',
            pageCount: 2,
            createdAt: '2026-07-12T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-b',
          },
        ],
      }),
    );

    await render(<PdfDocuments />);
    fireEvent.press(screen.getByRole('button', { name: 'Open lesson for second.pdf' }));

    expect(push).toHaveBeenCalledWith({
      pathname: '/lesson/[id]/player',
      params: { id: 'lesson-b' },
    });
    expect(push).not.toHaveBeenCalledWith({
      pathname: '/lesson/[id]/player',
      params: { id: 'lesson-a' },
    });
  });

  // Mutation: empty useCallback deps — must see the latest router after rerender.
  it('navigates with the latest router after it updates', async () => {
    const firstPush = jest.fn();
    const secondPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: firstPush });
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-gen',
            filename: 'done.pdf',
            pageCount: 3,
            createdAt: '2026-07-11T12:00:00.000Z',
            status: 'generated',
            lessonId: 'lesson-1',
          },
        ],
      }),
    );

    const { rerender } = await render(<PdfDocuments />);
    mockUseRouter.mockReturnValue({ push: secondPush });
    await act(async () => {
      rerender(<PdfDocuments />);
    });
    fireEvent.press(screen.getByRole('button', { name: 'Open lesson for done.pdf' }));

    expect(secondPush).toHaveBeenCalledWith({
      pathname: '/lesson/[id]/player',
      params: { id: 'lesson-1' },
    });
    expect(firstPush).not.toHaveBeenCalled();
  });

  // Mutation: deleteDocument is passed through — must call the latest identity.
  it('calls the latest deleteDocument after the hook return updates', async () => {
    const firstDelete = jest.fn();
    const secondDelete = jest.fn();
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        deleteDocument: firstDelete,
      }),
    );

    const { rerender } = await render(<PdfDocuments />);
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        deleteDocument: secondDelete,
      }),
    );
    await act(async () => {
      rerender(<PdfDocuments />);
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete notes.pdf' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    });

    expect(secondDelete).toHaveBeenCalledWith('doc-ready');
    expect(firstDelete).not.toHaveBeenCalled();
  });

  // Mutation: emptied StyleSheet root/heading — layout tokens must remain.
  it('applies row layout styles on the heading container', async () => {
    mockUsePdfDocuments.mockReturnValue(docsValue());
    await render(<PdfDocuments />);

    const heading = screen.getByText('Your PDFs');
    const flat = Object.assign(
      {},
      ...[heading.props.style].flat(Infinity).filter(Boolean),
    ) as Record<string, unknown>;
    expect(flat.color).toBeTruthy();
  });

  // Mutation: `root: {}` — wiring root must flex to fill the screen column.
  it('applies flex:1 on the PdfDocuments root container', async () => {
    mockUsePdfDocuments.mockReturnValue(docsValue());
    await render(<PdfDocuments />);
    // 'Your PDFs' -> TabsHeader's header row -> PdfDocuments' own root View.
    const root = screen.getByText('Your PDFs').parent?.parent;
    const flat = Object.assign(
      {},
      ...[root?.props?.style].flat(Infinity).filter(Boolean),
    ) as Record<string, unknown>;
    expect(flat.flex).toBe(1);
  });

  // Full-review major [a11y]/[code] WCAG 4.1.3 — surface delete failure while keeping content.
  it('shows a delete-failure banner when content has an error', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        error: new Error('delete failed'),
      }),
    );

    await render(<PdfDocuments />);

    expect(screen.getByText('notes.pdf')).toBeTruthy();
    expect(screen.queryByText("We couldn't load your PDFs.")).toBeNull();
    expect(screen.getByText("We couldn't delete that PDF.")).toBeTruthy();
  });

  it('announces delete failure via AccessibilityInfo when content shows a delete error', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-ready',
            filename: 'notes.pdf',
            pageCount: 12,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
        error: new Error('delete failed'),
      }),
    );

    await render(<PdfDocuments />);

    expect(announceSpy).toHaveBeenCalledWith("We couldn't delete that PDF.");
    announceSpy.mockRestore();
  });

  // Mutation: announce effect deps → [] — must re-announce when error appears after content mount.
  it('announces delete failure when error appears after a successful content load', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    const deleteFailed = "We couldn't delete that PDF.";
    const contentDocs = [
      {
        id: 'doc-ready',
        filename: 'notes.pdf',
        pageCount: 12,
        createdAt: '2026-07-13T12:00:00.000Z',
        status: 'ready' as const,
        lessonId: null,
      },
    ];

    mockUsePdfDocuments.mockReturnValue(docsValue({ documents: contentDocs }));
    const { rerender } = await render(<PdfDocuments />);
    expect(announceSpy).not.toHaveBeenCalledWith(deleteFailed);

    mockUsePdfDocuments.mockReturnValue(
      docsValue({ documents: contentDocs, error: new Error('delete failed') }),
    );
    await act(async () => {
      rerender(<PdfDocuments />);
    });

    expect(announceSpy).toHaveBeenCalledWith(deleteFailed);
    announceSpy.mockRestore();
  });

  it('does not show the delete-failure banner while loading or on load error', async () => {
    mockUsePdfDocuments.mockReturnValue(
      docsValue({ isLoading: true, error: new Error('delete failed') }),
    );
    await render(<PdfDocuments />);
    expect(screen.queryByText("We couldn't delete that PDF.")).toBeNull();

    mockUsePdfDocuments.mockReturnValue(
      docsValue({ error: new Error('load failed'), documents: [] }),
    );
    await render(<PdfDocuments />);
    expect(screen.queryByText("We couldn't delete that PDF.")).toBeNull();
    expect(screen.getByText("We couldn't load your PDFs.")).toBeTruthy();
  });

  it('does not announce delete failure unless content shows a delete error', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    const deleteFailed = "We couldn't delete that PDF.";

    mockUsePdfDocuments.mockReturnValue(
      docsValue({
        documents: [
          {
            id: 'doc-1',
            filename: 'one.pdf',
            pageCount: 1,
            createdAt: '2026-07-13T12:00:00.000Z',
            status: 'ready',
            lessonId: null,
          },
        ],
      }),
    );
    await render(<PdfDocuments />);
    expect(announceSpy).not.toHaveBeenCalledWith(deleteFailed);

    announceSpy.mockClear();
    mockUsePdfDocuments.mockReturnValue(
      docsValue({ isLoading: true, error: new Error('delete failed') }),
    );
    await render(<PdfDocuments />);
    expect(announceSpy).not.toHaveBeenCalledWith(deleteFailed);

    announceSpy.mockClear();
    mockUsePdfDocuments.mockReturnValue(
      docsValue({ error: new Error('load failed'), documents: [] }),
    );
    await render(<PdfDocuments />);
    expect(announceSpy).not.toHaveBeenCalledWith(deleteFailed);

    announceSpy.mockRestore();
  });
});
