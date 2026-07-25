jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_RETRY_LABEL,
  ErrorMessageWithRetry,
} from './error-message-with-retry';

const mockUseLocalization = useLocalization as jest.Mock;

describe('ErrorMessageWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the default message and retry label when no keys are passed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorMessageWithRetry onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent(DEFAULT_ERROR_MESSAGE);
    fireEvent.press(screen.getByRole('button', { name: DEFAULT_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('resolves message and retry labels from localization keys', async () => {
    const onRetry = jest.fn();
    await render(
      <ErrorMessageWithRetry
        messageKey="entitlements.error.message"
        retryKey="entitlements.error.retry"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('entitlements.error.message');
    fireEvent.press(screen.getByRole('button', { name: 'entitlements.error.retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
