import { NATIVE_TAB_TRIGGERS } from './native-tabs-triggers';

// Shared trigger contract for native + web tab layouts (@s1 @s10).
describe('NATIVE_TAB_TRIGGERS', () => {
  it('registers three durable tabs — index, pdf-files, settings; no upload/newLesson (@s1)', () => {
    const names = NATIVE_TAB_TRIGGERS.map((t) => t.name);
    const labelKeys = NATIVE_TAB_TRIGGERS.map((t) => t.labelKey);
    expect(names).toEqual(['index', 'pdf-files', 'settings']);
    expect(names).toHaveLength(3);
    expect(labelKeys.join(',')).not.toMatch(/newLesson/);
    expect(names.join(',')).not.toMatch(/upload/);
  });

  it('uses nav keys + platform glyphs (@s10)', () => {
    expect(NATIVE_TAB_TRIGGERS).toEqual([
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
    ]);
  });
});
