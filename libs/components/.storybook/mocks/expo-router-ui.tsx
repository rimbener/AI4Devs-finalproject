import React from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * Storybook stand-in for `expo-router/ui` — headless Tabs need a real router;
 * stories only need the chrome shell to render.
 */
export function Tabs({ children, style }: { children?: React.ReactNode; style?: object }) {
  return React.createElement(View, { style, testID: 'tabs' }, children);
}

export function TabSlot({ style }: { style?: object }) {
  return React.createElement(
    View,
    { style, testID: 'tab-slot' },
    React.createElement(Text, null, 'Tab content'),
  );
}

export function TabList({ asChild, children }: { asChild?: boolean; children?: React.ReactNode }) {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return React.createElement(View, { testID: 'tab-list' }, children);
}

export function TabTrigger({
  name,
  children,
  asChild,
}: {
  name: string;
  children?: React.ReactNode;
  asChild?: boolean;
  href?: string;
}) {
  const focused = name === 'index';
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      isFocused: focused,
      onPress: () => undefined,
    });
  }
  return React.createElement(
    Pressable,
    { testID: `trigger-${name}` },
    typeof children === 'string' ? React.createElement(Text, null, children) : children,
  );
}
