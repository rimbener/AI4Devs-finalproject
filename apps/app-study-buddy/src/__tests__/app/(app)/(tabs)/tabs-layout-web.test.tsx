let mockBreakpoint: 'desktop' | 'mobile' = 'desktop';

jest.mock('@helsoft/hooks', () => ({
  useBreakpoint: () => mockBreakpoint,
}));

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

jest.mock('@helsoft/components', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebBottomTabs: () => React.createElement(View, { testID: 'web-bottom-tabs' }),
  };
});

jest.mock('@helsoft/study-buddy', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AppChrome: () => React.createElement(View, { testID: 'app-chrome' }),
    NATIVE_TAB_TRIGGERS: [
      {
        name: 'index',
        href: '/',
        labelKey: 'nav.myLessons',
        sf: 'books.vertical',
        md: 'menu_book',
      },
      {
        name: 'pdf-files',
        href: '/pdf-files',
        labelKey: 'nav.myPdfFiles',
        sf: 'doc.text',
        md: 'picture_as_pdf',
      },
      {
        name: 'settings',
        href: '/settings',
        labelKey: 'nav.settings',
        sf: 'gearshape',
        md: 'settings',
      },
    ],
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Slot: () => React.createElement(View, { testID: 'slot' }),
  };
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

  it('does NOT render the Material web bottom tabs (@s3)', async () => {
    await render(<TabsWebLayout />);
    expect(screen.queryByTestId('web-bottom-tabs')).toBeNull();
  });
});

describe('@s2 @s15 narrow web (<768) — Material bottom tabs', () => {
  beforeEach(() => {
    mockBreakpoint = 'mobile';
  });

  it('renders WebBottomTabs Material bottom bar', async () => {
    await render(<TabsWebLayout />);
    expect(screen.getByTestId('web-bottom-tabs')).toBeTruthy();
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
