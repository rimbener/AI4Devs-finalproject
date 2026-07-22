import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appRoot = resolve(__dirname, '../../../app/(app)');
const tabsRoute = (name: string) => resolve(appRoot, `(tabs)/${name}`);
const appRoute = (name: string) => resolve(appRoot, name);

const readTabsLayout = (name: '_layout.tsx' | '_layout.web.tsx') =>
  readFileSync(tabsRoute(name), 'utf8');

// @s1 @s10 — NativeTabs trigger trees must not drift across platforms
describe('NativeTabs trigger wiring (native + web)', () => {
  it.each([
    '_layout.tsx',
    '_layout.web.tsx',
  ] as const)('%s imports NATIVE_TAB_TRIGGERS shared contract (@s1 @s10)', (file) => {
    const src = readTabsLayout(file);
    expect(src).toMatch(/NATIVE_TAB_TRIGGERS/);
    expect(src).toMatch(/@helsoft\/study-buddy/);
  });

  it.each([
    '_layout.tsx',
    '_layout.web.tsx',
  ] as const)('%s uses NativeTabs from expo-router/unstable-native-tabs', (file) => {
    const src = readTabsLayout(file);
    expect(src).toMatch(/expo-router\/unstable-native-tabs/);
    expect(src).toMatch(/NativeTabs/);
  });

  it.each([
    '_layout.tsx',
    '_layout.web.tsx',
  ] as const)('%s has no inline upload/newLesson trigger (@s1)', (file) => {
    const src = readTabsLayout(file);
    expect(src).not.toMatch(/name="upload"/);
    expect(src).not.toMatch(/nav\.newLesson/);
  });
});

// @s7 @s9 @s16 — upload + lesson outside tabs; deep-link back → My lessons
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

  it('anchors stack with initialRouteName (tabs) so deep-link /upload back → / My lessons (@s7 @s16)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/unstable_settings/);
    expect(src).toMatch(/initialRouteName:\s*['"]\(tabs\)['"]/);
    // (tabs)/index is My lessons at URL /
    expect(existsSync(tabsRoute('index.tsx'))).toBe(true);
    // upload is a sibling after (tabs): back pops to (tabs) → /
    const tabsIdx = src.indexOf('name="(tabs)"');
    const uploadIdx = src.indexOf('name="upload"');
    expect(tabsIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(tabsIdx);
  });
});

// @s16 — route group adds no URL segment; duplicate routes removed
describe('@s16 route structure + duplicate route removal', () => {
  it('(tabs) directory exists as a route group', () => {
    expect(existsSync(resolve(appRoot, '(tabs)'))).toBe(true);
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
