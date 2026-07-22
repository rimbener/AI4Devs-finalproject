jest.mock('@helsoft/hooks', () => ({
  ApiKeyProvider: ({ children }: { children: unknown }) => children,
  ProfileProvider: ({ children }: { children: unknown }) => children,
}));

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stack = Object.assign(
    ({ children }: { children?: unknown }) => React.createElement(View, null, children),
    { Screen: () => null },
  );
  return { Stack };
});

import { unstable_settings } from '../../../app/(app)/_layout';

// @s7 @s16 — concrete deep-link back destination (not only headerShown)
describe('(app)/_layout unstable_settings', () => {
  it('initialRouteName is (tabs) so /upload back returns to My lessons at /', () => {
    expect(unstable_settings).toEqual({ initialRouteName: '(tabs)' });
  });
});
