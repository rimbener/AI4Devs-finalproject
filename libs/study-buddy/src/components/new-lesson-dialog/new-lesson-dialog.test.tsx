jest.mock('../pdf-upload/use-pdf-upload', () => ({
  usePdfUpload: jest.fn(),
}));
jest.mock('../lesson-generation/lesson-generation', () => {
  const { Text } = require('react-native');
  return {
    LessonGeneration: ({ documentId }: { documentId: string | null }) => (
      <Text testID="lesson-generation-stub">{documentId}</Text>
    ),
  };
});
jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { usePdfUpload } from '../pdf-upload/use-pdf-upload';
import { NewLessonDialog } from './new-lesson-dialog';

const mockUseLocalization = useLocalization as jest.Mock;
const mockUsePdfUpload = usePdfUpload as jest.Mock;

const panelProps = {
  state: 'idle' as const,
  onChooseFile: jest.fn(),
  errorMessage: undefined,
  onRetry: jest.fn(),
  canRetry: false,
  maxMb: 10,
  maxPages: 20,
};

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
  });

  it('renders the choose-file trigger', async () => {
    await render(<NewLessonDialog />);
    expect(screen.getByText('upload.chooseFile')).toBeTruthy();
  });

  it('opens upload step and calls chooseFile on trigger press', async () => {
    const chooseFile = jest.fn();
    const resetUpload = jest.fn();
    mockUsePdfUpload.mockReturnValue({
      chooseFile,
      resetUpload,
      retry: jest.fn(),
      panelProps,
    });

    await render(<NewLessonDialog />);
    fireEvent.press(screen.getByText('upload.chooseFile'));

    expect(resetUpload).toHaveBeenCalled();
    expect(chooseFile).toHaveBeenCalled();
  });

  it('opens on generate step when generateDocumentId is set', async () => {
    const onGenerateHandled = jest.fn();
    await render(
      <NewLessonDialog generateDocumentId="doc-1" onGenerateHandled={onGenerateHandled} />,
    );

    expect(onGenerateHandled).toHaveBeenCalled();
    expect(screen.getByTestId('lesson-generation-stub')).toHaveTextContent('doc-1');
    expect(screen.getByText('generation.dialogHeadline')).toBeTruthy();
  });
});
