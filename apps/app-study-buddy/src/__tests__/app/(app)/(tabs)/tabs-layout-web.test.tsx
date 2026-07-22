import type { ReactNode } from 'react';

let mockBreakpoint: 'desktop' | 'mobile' = 'desktop';

jest.mock('@helsoft/hooks', () => ({
  useBreakpoint: () => mockBreakpoint,
}));

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

jest.mock('@helsoft/study-buddy', () => {
  const React = require('react');
  const { View } = require('react-native');
  const { NATIVE_TAB_TRIGGERS } = jest.requireActual(
    '@helsoft/study-buddy/src/components/app-chrome/native-tabs-triggers',
  );
  return {
    AppChrome: () => React.createElement(View, { testID: 'app-chrome' }),
    NATIVE_TAB_TRIGGERS,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Slot: () => React.createElement(View, { testID: 'slot' }),
  };
});

jest.mock('expo-router/unstable-native-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Trigger = Object.assign(
    ({ name, children }: { name: string; children?: ReactNode }) =>
      React.createElement(View, { testID: `trigger-${name}` }, children),
    {
      Label: ({ children }: { children?: ReactNode }) => {
        const React = require('react');
        const { Text } = require('react-native');
        return React.createElement(Text, null, children);
      },
      Icon: () => null,
    },
  );

  const NativeTabs = Object.assign(
    ({ children }: { children?: ReactNode }) =>
      React.createElement(View, { testID: 'native-tabs' }, children),
    { Trigger },
  );

  return { NativeTabs };
});

import { render, screen } from '@testing-library/react-native';

import TabsWebLayout from '../../../../app/(app)/(tabs)/_layout.web';

describe('@s3 @s15 wide web (≥768) — desktop top bar', () => {
  beforeEach(() => {
    mockBreakpoint = 'desktop';
  });

  it('renders AppChrome for the desktop top bar', async () => {
    await render(<TabsWebLayout />);
    expect(screen.getByTestId('app-chrome')).toBeTruthy();
  });

  it('renders a Slot for screen content', async () => {
    await render(<TabsWebLayout />);
    expect(screen.getByTestId('slot')).toBeTruthy();
  });

  it('does NOT render NativeTabs bottom bar (@s3)', async () => {
    await render(<TabsWebLayout />);
    expect(screen.queryByTestId('native-tabs')).toBeNull();
  });
});

describe('@s2 @s15 narrow web (<768) — native tab bar', () => {
  beforeEach(() => {
    mockBreakpoint = 'mobile';
  });

  it('renders NativeTabs bottom bar', async () => {
    await render(<TabsWebLayout />);
    expect(screen.getByTestId('native-tabs')).toBeTruthy();
  });

  it('renders My lessons and Settings triggers — no New lesson (@s2)', async () => {
    await render(<TabsWebLayout />);
    expect(screen.getByTestId('trigger-index')).toBeTruthy();
    expect(screen.getByTestId('trigger-settings')).toBeTruthy();
    expect(screen.queryByTestId('trigger-upload')).toBeNull();
  });

  it('does NOT render AppChrome', async () => {
    await render(<TabsWebLayout />);
    expect(screen.queryByTestId('app-chrome')).toBeNull();
  });

  it('does NOT render the retired custom mobile bar (@s2)', async () => {
    await render(<TabsWebLayout />);
    expect(screen.queryByTestId('mobile-top-bar')).toBeNull();
    expect(screen.queryByTestId('mobile-bottom-bar')).toBeNull();
  });
});
