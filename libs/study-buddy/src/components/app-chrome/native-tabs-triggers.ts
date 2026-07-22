export type NativeTabTriggerConfig = {
  name: 'index' | 'settings';
  labelKey: 'nav.myLessons' | 'nav.settings';
  sf: 'books.vertical' | 'gearshape';
  md: 'menu_book' | 'settings';
};

/** Shared NativeTabs trigger contract — used by native + web `(tabs)` layouts. */
export const NATIVE_TAB_TRIGGERS: readonly NativeTabTriggerConfig[] = [
  {
    name: 'index',
    labelKey: 'nav.myLessons',
    sf: 'books.vertical',
    md: 'menu_book',
  },
  {
    name: 'settings',
    labelKey: 'nav.settings',
    sf: 'gearshape',
    md: 'settings',
  },
];
