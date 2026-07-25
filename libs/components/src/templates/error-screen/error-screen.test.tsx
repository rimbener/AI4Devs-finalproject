jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_RETRY_LABEL,
} from '../../molecules/error-message-with-retry/error-message-with-retry';
import { ErrorScreen } from './error-screen';

const mockUseLocalization = useLocalization as jest.Mock;

describe('ErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders ErrorMessageWithRetry inside a SafeAreaView screen container', async () => {
    const onRetry = jest.fn();
    await render(<ErrorScreen testID="error-screen" onRetry={onRetry} />);

    expect(screen.getByTestId('error-screen')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent(DEFAULT_ERROR_MESSAGE);
    fireEvent.press(screen.getByRole('button', { name: DEFAULT_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('forwards localization keys to ErrorMessageWithRetry', async () => {
    await render(
      <ErrorScreen
        messageKey="entitlements.error.message"
        retryKey="entitlements.error.retry"
        onRetry={jest.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('entitlements.error.message');
    expect(screen.getByRole('button', { name: 'entitlements.error.retry' })).toBeTruthy();
  });
});
