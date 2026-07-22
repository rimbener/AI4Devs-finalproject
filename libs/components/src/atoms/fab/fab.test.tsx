import { fireEvent, render, screen } from '@testing-library/react-native';

import { Fab } from './fab';

describe('Fab', () => {
  it('renders an accessible icon-only FAB', async () => {
    const onPress = jest.fn();
    await render(<Fab icon="add" accessibilityLabel="Create lesson" onPress={onPress} />);

    const fab = screen.getByRole('button', { name: 'Create lesson' });
    fireEvent.press(fab);

    expect(screen.getByText('add')).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the extended label as the accessible name', async () => {
    await render(<Fab icon="edit" label="Compose" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Compose' })).toBeTruthy();
    expect(screen.getByText('Compose')).toBeTruthy();
  });
});
