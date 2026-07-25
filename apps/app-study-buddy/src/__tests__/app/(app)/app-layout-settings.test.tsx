jest.mock('@helsoft/hooks', () => ({
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
    {
      // Captures name/options so header wiring (headerShown/title) is asserted on the
      // rendered output, not on the source text.
      Screen: ({ name, options }: { name: string; options?: Record<string, unknown> }) =>
        React.createElement(View, { testID: `screen-${name}`, ...options }),
    },
  );
  return { Stack };
});

import { LESSON_STACK_SCREENS } from '@helsoft/study-buddy';
import { render, screen as rtlScreen } from '@testing-library/react-native';

import AppLayout, { unstable_settings } from '../../../app/(app)/_layout';

// @s7 @s16 — concrete deep-link back destination (not only headerShown)
describe('(app)/_layout unstable_settings', () => {
  it('initialRouteName is (tabs) so lesson deep-links return to the tab shell', () => {
    expect(unstable_settings).toEqual({ initialRouteName: '(tabs)' });
  });
});

// @s1 @s2 @s3 @s7 @s8 — rendered Stack.Screen props prove header wiring per route
describe('(app)/_layout.tsx Stack.Screen rendering', () => {
  it('(tabs) screen has headerShown: false so the root tab shell stays headerless (@s7)', async () => {
    await render(<AppLayout />);
    expect(rtlScreen.getByTestId('screen-(tabs)').props.headerShown).toBe(false);
  });

  it('(tabs) screen has a title so the pushed lesson screens\' back button reads "My lessons", not the route name "(tabs)" (@s4)', async () => {
    await render(<AppLayout />);
    // Mocked t(k) => k, so the resolved title is the key itself.
    expect(rtlScreen.getByTestId('screen-(tabs)').props.title).toBe('nav.myLessons');
  });

  it.each(
    LESSON_STACK_SCREENS,
  )('$name screen resolves its title via t(titleKey) and keeps the default header (@s1 @s2 @s3)', async ({
    name,
    titleKey,
  }) => {
    await render(<AppLayout />);
    const props = rtlScreen.getByTestId(`screen-${name}`).props;
    // Mocked t(k) => k, so the resolved title is the titleKey itself.
    expect(props.title).toBe(titleKey);
    expect(props.headerShown).not.toBe(false);
  });

  it('renders (tabs) then the three lesson screens, in LESSON_STACK_SCREENS order (@s8)', async () => {
    await render(<AppLayout />);
    const renderedNames = rtlScreen
      .getAllByTestId(/^screen-/)
      .map((element) => (element.props.testID as string).replace(/^screen-/, ''));
    expect(renderedNames).toEqual(['(tabs)', ...LESSON_STACK_SCREENS.map((s) => s.name)]);
  });
});
