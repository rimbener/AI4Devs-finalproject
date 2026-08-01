import type { ReactNode } from 'react';

let mockPathname = '/';

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

// Avoid study-buddy barrel → AsyncStorage; layout only needs NATIVE_TAB_TRIGGERS.
// requireActual of the concrete module keeps the test on the app's real tab data.
jest.mock('@helsoft/study-buddy', () => ({
  NATIVE_TAB_TRIGGERS: jest.requireActual(
    '../../../../../../../libs/study-buddy/src/components/app-chrome/native-tabs-triggers',
  ).NATIVE_TAB_TRIGGERS,
}));

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

// Mirrors Expo NativeTabs selection: Trigger.name matching the active route is selected
// and exposed to AT via accessibilityState.selected (@s5).
jest.mock('expo-router/unstable-native-tabs', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const { usePathname } = require('expo-router');

  const Trigger = Object.assign(
    ({ name, children }: { name: string; children?: ReactNode }) => {
      const pathname = usePathname() as string;
      const selected =
        name === 'settings' ? pathname === '/settings' : pathname === '/' || pathname === '';
      return React.createElement(
        View,
        {
          testID: `trigger-${name}`,
          accessibilityRole: 'tab',
          accessibilityState: { selected },
        },
        children,
      );
    },
    {
      Label: ({ children }: { children?: ReactNode }) => React.createElement(Text, null, children),
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

import TabsLayout from '../../../../app/(app)/(tabs)/_layout';

// @s5 — selected tab on the real NativeTabs layout path (not a dead helper)
describe('native (tabs)/_layout.tsx selection (@s5)', () => {
  it('marks index Trigger selected on / and settings unselected', async () => {
    mockPathname = '/';
    await render(<TabsLayout />);
    expect(screen.getByTestId('trigger-index').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('trigger-settings').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('marks settings Trigger selected on /settings and index unselected', async () => {
    mockPathname = '/settings';
    await render(<TabsLayout />);
    expect(screen.getByTestId('trigger-settings').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('trigger-index').props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
