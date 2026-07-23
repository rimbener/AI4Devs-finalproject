export type NativeTabTriggerConfig = {
  name: 'index' | 'settings';
  /** Expo Router href for headless web tabs (`expo-router/ui`). */
  href: '/' | '/settings';
  labelKey: 'nav.myLessons' | 'nav.settings';
  sf: 'books.vertical' | 'gearshape';
  md: 'menu_book' | 'settings';
};

/** Shared tab trigger contract — native NativeTabs + web Material bottom bar. */
export const NATIVE_TAB_TRIGGERS: readonly NativeTabTriggerConfig[] = [
  {
    name: 'index',
    href: '/',
    labelKey: 'nav.myLessons',
    sf: 'books.vertical',
    md: 'menu_book',
  },
  {
    name: 'settings',
    href: '/settings',
    labelKey: 'nav.settings',
    sf: 'gearshape',
    md: 'settings',
  },
];
