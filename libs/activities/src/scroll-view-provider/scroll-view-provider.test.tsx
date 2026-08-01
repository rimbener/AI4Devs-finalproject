import { render, screen } from '@testing-library/react-native';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { ScrollViewProvider, useScrollViewRef } from './scroll-view-provider';

describe('ScrollViewProvider', () => {
  it('exposes no ScrollView ref outside the provider', async () => {
    let captured: unknown;
    const Probe = () => {
      captured = useScrollViewRef();
      return <Text>probe</Text>;
    };

    await render(<Probe />);

    expect(captured).toBeNull();
  });

  it('exposes a stable ScrollView ref to descendants', async () => {
    const identities: Array<{ current: unknown } | null> = [];
    const Probe = () => {
      const ref = useScrollViewRef();
      identities.push(ref);
      return <Text>probe</Text>;
    };
    const Harness = () => {
      const [, setCount] = useState(0);
      return (
        <ScrollViewProvider>
          <Probe />
          <Text onPress={() => setCount((c) => c + 1)}>bump</Text>
        </ScrollViewProvider>
      );
    };

    const { rerender } = await render(<Harness />);
    await rerender(<Harness />);

    expect(identities.length).toBeGreaterThan(1);
    expect(identities[0]).not.toBeNull();
    expect(identities.every((ref) => ref === identities[0])).toBe(true);
  });

  it('attaches the rendered ScrollView to the exposed ref', async () => {
    let captured: unknown = null;
    const Probe = () => {
      const ref = useScrollViewRef();
      useEffect(() => {
        captured = ref?.current ?? null;
      }, [ref]);
      return <Text>probe</Text>;
    };

    await render(
      <ScrollViewProvider>
        <Probe />
      </ScrollViewProvider>,
    );

    expect(captured).not.toBeNull();
  });

  it('forwards ScrollView props to the rendered ScrollView', async () => {
    await render(
      <ScrollViewProvider testID="provided-scroll" contentContainerStyle={{ padding: 8 }}>
        <Text>inside</Text>
      </ScrollViewProvider>,
    );

    expect(screen.getByTestId('provided-scroll')).toBeTruthy();
    expect(screen.getByText('inside')).toBeTruthy();
  });
});
