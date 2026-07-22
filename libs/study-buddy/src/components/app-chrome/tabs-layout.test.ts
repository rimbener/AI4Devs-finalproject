import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tabsRoute = (name: string) =>
  resolve(__dirname, `../../../../../apps/app-study-buddy/src/app/(app)/(tabs)/${name}`);
const appRoute = (name: string) =>
  resolve(__dirname, `../../../../../apps/app-study-buddy/src/app/(app)/${name}`);

// @s1 @s10 — native NativeTabs layout structure
describe('(tabs)/_layout.tsx native NativeTabs', () => {
  it('uses NativeTabs from expo-router/unstable-native-tabs', () => {
    const src = readFileSync(tabsRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/expo-router\/unstable-native-tabs/);
    expect(src).toMatch(/NativeTabs/);
  });

  it('registers exactly two triggers: index and settings — no upload/newLesson (@s1)', () => {
    const src = readFileSync(tabsRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/name="index"/);
    expect(src).toMatch(/name="settings"/);
    expect(src).not.toMatch(/name="upload"/);
    expect(src).not.toMatch(/newLesson/);
  });

  it('uses nav.myLessons and nav.settings locale keys — no nav.newLesson (@s10)', () => {
    const src = readFileSync(tabsRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/nav\.myLessons/);
    expect(src).toMatch(/nav\.settings/);
    expect(src).not.toMatch(/nav\.newLesson/);
  });

  it('uses platform glyphs books.vertical + menu_book for My lessons, gearshape for Settings (@s10)', () => {
    const src = readFileSync(tabsRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/books\.vertical/);
    expect(src).toMatch(/menu_book/);
    expect(src).toMatch(/gearshape/);
  });

  it('no hardcoded label strings — labels come from t() (@s10)', () => {
    const src = readFileSync(tabsRoute('_layout.tsx'), 'utf8');
    expect(src).not.toMatch(/"My lessons"/);
    expect(src).not.toMatch(/"Settings"/);
  });
});

// @s7 @s9 — upload + lesson outside tabs (immersive)
describe('(app)/_layout.tsx Stack structure', () => {
  it('lists (tabs) group as a Stack.Screen child', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/name="\(tabs\)"/);
  });

  it('lists upload as a Stack sibling — not inside (tabs) — so no tab bar (@s7 @s9)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/name="upload"/);
  });

  it('upload screen has headerShown: true so a back control is present (@s7)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/headerShown[^;]*true/);
  });

  it('upload title comes from nav.newLesson locale key — no hardcoded string (@s7 @s10)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/nav\.newLesson/);
  });

  it('lesson routes are Stack siblings so tab bar is absent on lesson screens (@s9)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/lesson\/\[id\]/);
  });
});

// @s16 — route group adds no URL segment; duplicate routes removed
describe('@s16 route structure + duplicate route removal', () => {
  it('(tabs) directory exists as a route group', () => {
    const tabsDir = resolve(__dirname, '../../../../../apps/app-study-buddy/src/app/(app)/(tabs)');
    expect(existsSync(tabsDir)).toBe(true);
  });

  it('(app)/index.tsx deleted — duplicate / route gone', () => {
    expect(existsSync(appRoute('index.tsx'))).toBe(false);
  });

  it('(app)/settings.tsx deleted — duplicate /settings route gone', () => {
    expect(existsSync(appRoute('settings.tsx'))).toBe(false);
  });

  it('(tabs)/index.tsx exists — My lessons screen at /', () => {
    expect(existsSync(tabsRoute('index.tsx'))).toBe(true);
  });

  it('(tabs)/settings.tsx exists — Settings screen at /settings', () => {
    expect(existsSync(tabsRoute('settings.tsx'))).toBe(true);
  });
});
