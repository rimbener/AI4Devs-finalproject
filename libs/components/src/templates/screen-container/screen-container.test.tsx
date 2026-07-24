import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ScreenContainer } from './screen-container';

describe('ScreenContainer', () => {
  it('renders children', async () => {
    await render(
      <ScreenContainer testID="screen">
        <Text>Body</Text>
      </ScreenContainer>,
    );

    expect(screen.getByTestId('screen')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('defaults to all four safe-area edges', async () => {
    await render(
      <ScreenContainer testID="screen">
        <Text>Body</Text>
      </ScreenContainer>,
    );

    expect(screen.getByTestId('screen').props.edges).toEqual({
      top: 'additive',
      right: 'additive',
      bottom: 'additive',
      left: 'additive',
    });
  });

  it('forwards a custom edges list, e.g. excluding top under a native header', async () => {
    await render(
      <ScreenContainer testID="screen" edges={['left', 'right', 'bottom']}>
        <Text>Body</Text>
      </ScreenContainer>,
    );

    expect(screen.getByTestId('screen').props.edges).toEqual({
      top: 'off',
      right: 'additive',
      bottom: 'additive',
      left: 'additive',
    });
  });
});
