jest.mock('expo-router/ui', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Tabs: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: 'tabs' }, children),
    TabSlot: () => React.createElement(View, { testID: 'tab-slot' }),
    TabList: ({ asChild, children }: { asChild?: boolean; children?: React.ReactNode }) => {
      if (asChild && React.isValidElement(children)) {
        return children;
      }
      return React.createElement(View, { testID: 'tab-list' }, children);
    },
    TabTrigger: ({
      name,
      children,
    }: {
      name: string;
      children?: React.ReactNode;
      href?: string;
      asChild?: boolean;
    }) =>
      React.createElement(
        View,
        { testID: `trigger-${name}` },
        React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement, {
              isFocused: name === 'settings',
            })
          : children,
      ),
  };
});

import { render, screen } from '@testing-library/react-native';

import { WebBottomTabs } from './web-bottom-tabs';
import type { WebBottomTabTrigger } from './web-bottom-tabs.types';

const triggers: readonly WebBottomTabTrigger[] = [
  { name: 'index', href: '/', label: 'My lessons', icon: 'menu_book' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings' },
];

describe('WebBottomTabs', () => {
  it('renders the Material bottom tab bar shell', async () => {
    await render(<WebBottomTabs triggers={triggers} />);
    expect(screen.getByTestId('web-bottom-tabs')).toBeTruthy();
    expect(screen.getByTestId('tab-slot')).toBeTruthy();
    expect(screen.getByTestId('tab-list')).toBeTruthy();
  });

  it('renders injected triggers — no New lesson', async () => {
    await render(<WebBottomTabs triggers={triggers} />);
    expect(screen.getByTestId('trigger-index')).toBeTruthy();
    expect(screen.getByTestId('trigger-settings')).toBeTruthy();
    expect(screen.queryByTestId('trigger-upload')).toBeNull();
    expect(screen.getByText('My lessons')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });
});
