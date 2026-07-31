import { render, screen } from '@testing-library/react-native';

import { ErrorBanner } from './error-banner';

describe('ErrorBanner', () => {
  it('renders the error message', async () => {
    await render(<ErrorBanner errorMessage="Something went wrong." />);

    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('exposes the container with an alert accessibility role', async () => {
    await render(<ErrorBanner errorMessage="Something went wrong." />);

    expect(screen.getByText('Something went wrong.').parent?.props.accessibilityRole).toBe('alert');
  });

  it('exposes the message as an assertive live region', async () => {
    await render(<ErrorBanner errorMessage="Something went wrong." />);

    expect(screen.getByText('Something went wrong.').props.accessibilityLiveRegion).toBe(
      'assertive',
    );
  });
});
