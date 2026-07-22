import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from './card';

describe('Card', () => {
  it('renders children', async () => {
    await render(
      <Card testID="card">
        <Text>Body</Text>
      </Card>,
    );

    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('calls onPress when pressable', async () => {
    const onPress = jest.fn();
    await render(
      <Card testID="card" onPress={onPress}>
        <Text>Tap</Text>
      </Card>,
    );

    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
