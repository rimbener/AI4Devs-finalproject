jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { render, screen } from '@testing-library/react-native';

import { SubmittingIndicator } from './submitting-indicator';

const mockUseLocalization = useLocalization as jest.Mock;

describe('SubmittingIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the localized saving label', async () => {
    await render(<SubmittingIndicator />);

    expect(screen.getByText('general.saving')).toBeTruthy();
  });

  it('exposes the saving label as a polite live region', async () => {
    await render(<SubmittingIndicator />);

    expect(screen.getByText('general.saving').props.accessibilityLiveRegion).toBe('polite');
  });

  it('renders a linear indeterminate progress indicator', async () => {
    await render(<SubmittingIndicator />);

    expect(screen.getByTestId('progress-linear-indeterminate')).toBeTruthy();
  });

  it('applies bodyMedium on-surface-variant styles with top spacing', async () => {
    await render(<SubmittingIndicator />);

    expect(screen.getByText('general.saving').props.style).toEqual(
      expect.objectContaining({
        marginTop: 16,
        fontFamily: 'IBM Plex Sans',
        fontSize: 14,
        color: '#414950',
      }),
    );
  });
});
