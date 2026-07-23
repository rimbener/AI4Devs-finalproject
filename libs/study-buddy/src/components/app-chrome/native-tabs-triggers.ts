export type NativeTabTriggerConfig = {
  name: 'index' | 'pdf-files' | 'settings';
  /** Expo Router href for headless web tabs (`expo-router/ui`). */
  href: '/' | '/pdf-files' | '/settings';
  labelKey: 'nav.myLessons' | 'nav.myPdfFiles' | 'nav.settings';
  sf: 'books.vertical' | 'doc.text' | 'gearshape';
  md: 'menu_book' | 'picture_as_pdf' | 'settings';
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
];
