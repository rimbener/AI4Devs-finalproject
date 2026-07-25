jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useLessonGeneration: jest.fn(),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

import { QueryProvider, useLessonGeneration, useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { SupabaseClient } from '@helsoft/supabase-services';
import { initSupabase } from '@helsoft/supabase-services';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { PdfDocuments } from './pdf-documents';

const renderPdfDocuments = () => render(<PdfDocuments />, { wrapper: QueryProvider });

const mockUseLessonGeneration = useLessonGeneration as jest.Mock;
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
  if (key === 'upload.chooseFile') return 'Choose PDF';
  if (key === 'upload.dialogHeadline') return 'Upload PDF';
  if (key === 'upload.dialogClose') return 'Close';
  if (key === 'generation.dialogHeadline') return 'Generate lesson';
  return key;
};

const mockUserDocumentsOrder = (rows: unknown[]) => {
  const order = jest.fn().mockResolvedValue({ data: rows, error: null });
  const select = jest.fn(() => ({ order }));
  return { select, order };
};

/**
 * Integration: PdfDocuments → usePdfDocuments → PdfDocumentsService → PdfDocumentsDao
 * (self-contained wiring with NewLessonDialog + router).
 */
describe('PdfDocuments integration (wiring → hook → service → DAO)', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = initSupabase({ url: 'https://example.supabase.co', anonKey: 'anon-key' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    mockUseProfile.mockReturnValue({
      profile: {
        plan: 'paid',
        keySource: 'platform',
        showKeySettings: false,
        showAds: false,
        canCreate: true,
      },
      isLoading: false,
      error: null,
      retry: jest.fn(),
    });
    mockUseLocalization.mockReturnValue({
      t,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
    mockUseLessonGeneration.mockReturnValue({
      stage: 'idle',
      currentStep: 'reading',
      result: undefined,
      error: undefined,
      generate: jest.fn(),
      reset: jest.fn(),
    });
  });

  it('renders documents from the DAO through the hook', async () => {
    const { select } = mockUserDocumentsOrder([
      {
        id: 'doc-1',
        filename: 'notes.pdf',
        page_count: 12,
        created_at: '2026-07-13T12:00:00.000Z',
        status: 'ready',
        lesson_id: null,
      },
    ]);
    // biome-ignore lint/suspicious/noExplicitAny: test double
    jest.spyOn(client, 'from' as any).mockReturnValue({ select } as any);

    await renderPdfDocuments();

    await waitFor(() => {
      expect(screen.getByText('notes.pdf')).toBeTruthy();
    });
  });
});
