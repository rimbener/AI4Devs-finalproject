import { fireEvent, render, screen } from '@testing-library/react-native';

import { Dialog } from './dialog';

describe('Dialog', () => {
  it('renders headline, body, and default actions when open', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <Dialog open headline="Delete lesson?" onClose={onClose} onConfirm={onConfirm}>
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByText('Delete lesson?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('hides content when closed', async () => {
    await render(
      <Dialog open={false} headline="Hidden">
        Body
      </Dialog>,
    );

    expect(screen.queryByText('Hidden')).toBeNull();
  });
});
