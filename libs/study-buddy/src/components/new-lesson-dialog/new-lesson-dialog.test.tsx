jest.mock('../pdf-upload/use-pdf-upload', () => ({
  usePdfUpload: jest.fn(),
}));
/** Capture the onOpenInPlayer prop so a test can invoke it directly (mirrors
 * lesson-generation.test.tsx's capturedPanelValue pattern). */
const capturedLessonGenerationProps: {
  current?: { onOpenInPlayer?: () => void };
} = {};
jest.mock('../lesson-generation/lesson-generation', () => {
  const { Text } = require('react-native');
  return {
    LessonGeneration: ({
      documentId,
      onOpenInPlayer,
    }: {
      documentId: string | null;
      onOpenInPlayer?: () => void;
    }) => {
      capturedLessonGenerationProps.current = { onOpenInPlayer };
      return <Text testID="lesson-generation-stub">{documentId}</Text>;
    },
  };
});
jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));
jest.mock('./use-new-lesson-dialog', () => ({
  useNewLessonDialog: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { usePdfUpload } from '../pdf-upload/use-pdf-upload';
import { NewLessonDialog } from './new-lesson-dialog';
import { useNewLessonDialog } from './use-new-lesson-dialog';

const mockUseLocalization = useLocalization as jest.Mock;
const mockUsePdfUpload = usePdfUpload as jest.Mock;
const mockUseNewLessonDialog = useNewLessonDialog as jest.Mock;

const panelProps = {
  state: 'idle' as const,
  onChooseFile: jest.fn(),
  errorMessage: undefined,
  onRetry: jest.fn(),
  canRetry: false,
  maxMb: 10,
  maxPages: 20,
};

const dialogValue = (overrides: Partial<ReturnType<typeof useNewLessonDialog>> = {}) => ({
  open: false,
  step: 'upload' as const,
  documentId: undefined,
  panelProps,
  chooseFile: jest.fn(),
  resetUpload: jest.fn(),
  openUpload: jest.fn(),
  close: jest.fn(),
  ...overrides,
});

describe('NewLessonDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUsePdfUpload.mockReturnValue({
      chooseFile: jest.fn(),
      resetUpload: jest.fn(),
      retry: jest.fn(),
      panelProps,
    });
    mockUseNewLessonDialog.mockReturnValue(dialogValue());
  });

  it('renders the choose-file trigger', async () => {
    await render(<NewLessonDialog />);
    expect(screen.getByText('upload.chooseFile')).toBeTruthy();
  });

  it('opens upload step on trigger press without auto-choosing a file', async () => {
    const resetUpload = jest.fn();
    const openUpload = jest.fn();
    mockUseNewLessonDialog.mockReturnValue(dialogValue({ resetUpload, openUpload }));

    await render(<NewLessonDialog />);
    fireEvent.press(screen.getByText('upload.chooseFile'));

    expect(resetUpload).toHaveBeenCalled();
    expect(openUpload).toHaveBeenCalled();
  });

  it('opens on generate step when generateDocumentId is set', async () => {
    const onGenerateHandled = jest.fn();
    mockUseNewLessonDialog.mockReturnValue(
      dialogValue({
        open: true,
        step: 'generate',
        documentId: 'doc-1',
      }),
    );
    // Hook still receives generateDocumentId; effect coverage lives in the hook tests.
    mockUseNewLessonDialog.mockImplementation((args) => {
      args.onGenerateHandled?.();
      return dialogValue({
        open: true,
        step: 'generate',
        documentId: 'doc-1',
      });
    });

    await render(
      <NewLessonDialog generateDocumentId="doc-1" onGenerateHandled={onGenerateHandled} />,
    );

    expect(onGenerateHandled).toHaveBeenCalled();
    expect(screen.getByTestId('lesson-generation-stub')).toHaveTextContent('doc-1');
    expect(screen.getByText('generation.dialogHeadline')).toBeTruthy();
  });

  // Mutation — step/ternary/t() headline + upload panel guard on upload step.
  it('shows upload headline and PdfUploadPanel on the upload step', async () => {
    mockUseNewLessonDialog.mockReturnValue(dialogValue({ open: true, step: 'upload' }));

    await render(<NewLessonDialog />);

    expect(screen.getByText('upload.dialogHeadline')).toBeTruthy();
    expect(screen.getByText('upload.constraintsHint')).toBeTruthy();
    expect(screen.queryByTestId('lesson-generation-stub')).toBeNull();
    expect(screen.getByText('upload.dialogClose')).toBeTruthy();
  });

  // Mutation — generate panel guard → always true; upload panel ≠ / "".
  it('hides PdfUploadPanel and shows generation on the generate step', async () => {
    mockUseNewLessonDialog.mockReturnValue(
      dialogValue({ open: true, step: 'generate', documentId: 'doc-9' }),
    );

    await render(<NewLessonDialog />);

    expect(screen.getByTestId('lesson-generation-stub')).toHaveTextContent('doc-9');
    expect(screen.queryByText('upload.constraintsHint')).toBeNull();
    expect(screen.queryByText('upload.dialogHeadline')).toBeNull();
    expect(screen.getByText('generation.dialogHeadline')).toBeTruthy();
  });

  // Mutation — handleClose body → {}; dialogClose t("").
  it('closes the dialog when the close action is pressed', async () => {
    const close = jest.fn();
    mockUseNewLessonDialog.mockReturnValue(dialogValue({ open: true, step: 'upload', close }));

    await render(<NewLessonDialog />);

    fireEvent.press(screen.getByRole('button', { name: 'upload.dialogClose' }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  // Regression — LessonGeneration's "Open in player" CTA must dismiss this dialog too, otherwise
  // it stays open on top of the pushed player screen.
  it('passes the dialog close handler as onOpenInPlayer to LessonGeneration', async () => {
    const close = jest.fn();
    mockUseNewLessonDialog.mockReturnValue(
      dialogValue({ open: true, step: 'generate', documentId: 'doc-1', close }),
    );

    await render(<NewLessonDialog />);
    capturedLessonGenerationProps.current?.onOpenInPlayer?.();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
