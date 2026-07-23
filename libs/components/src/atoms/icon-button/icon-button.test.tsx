import { fireEvent, render, screen } from '@testing-library/react-native';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('renders an accessible button that fires onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="close" accessibilityLabel="Dismiss" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('close')).toBeTruthy();
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <IconButton icon="close" accessibilityLabel="Dismiss" disabled onPress={onPress} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
