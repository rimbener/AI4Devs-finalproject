import { NATIVE_TAB_TRIGGERS } from './native-tabs-triggers';

// Shared trigger contract for native + web NativeTabs layouts (@s1 @s10).
describe('NATIVE_TAB_TRIGGERS', () => {
  it('registers exactly two durable tabs — index and settings, no upload/newLesson (@s1)', () => {
    const names = NATIVE_TAB_TRIGGERS.map((t) => t.name);
    const labelKeys = NATIVE_TAB_TRIGGERS.map((t) => t.labelKey);
    expect(names).toEqual(['index', 'settings']);
    expect(names).toHaveLength(2);
    expect(labelKeys.join(',')).not.toMatch(/newLesson/);
    expect(names.join(',')).not.toMatch(/upload/);
  });

  it('uses nav.myLessons + nav.settings and platform glyphs (@s10)', () => {
    expect(NATIVE_TAB_TRIGGERS).toEqual([
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
    ]);
  });
});
