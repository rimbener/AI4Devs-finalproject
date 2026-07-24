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
  ] as const)('%s uses NativeTabs from expo-router/unstable-native-tabs', (file) => {
    const src = readTabsLayout(file);
    expect(src).toMatch(/expo-router\/unstable-native-tabs/);
    expect(src).toMatch(/NativeTabs/);
  });

  it('_layout.web.tsx uses WebBottomTabs for narrow web', () => {
    const src = readTabsLayout('_layout.web.tsx');
    expect(src).toMatch(/WebBottomTabs/);
    expect(src).toMatch(/NATIVE_TAB_TRIGGERS/);
    expect(src).not.toMatch(/unstable-native-tabs/);
  });

  it('(tabs)/pdf-files.tsx exists — PDF files tab screen', () => {
    expect(existsSync(tabsRoute('pdf-files.tsx'))).toBe(true);
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

// @s9 @s16 — lesson outside tabs; stack anchors on (tabs)
describe('(app)/_layout.tsx Stack structure', () => {
  it('lists (tabs) group as a Stack.Screen child', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/name="\(tabs\)"/);
  });

  it('does not register a retired upload Stack screen', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).not.toMatch(/name="upload"/);
    expect(existsSync(appRoute('upload.tsx'))).toBe(false);
  });

  // @s9 structural proof (lesson routes rendered as Stack.Screen siblings of (tabs), so
  // the tab bar is absent on lesson screens) lives in the rendering test in
  // `app-layout-settings.test.tsx` ("renders (tabs) then the three lesson screens, in
  // LESSON_STACK_SCREENS order"), which asserts actual render output/order rather than
  // source text. Kept here only as a cheap source-presence guard.
  it('imports LESSON_STACK_SCREENS from @helsoft/study-buddy for the lesson Stack.Screen list', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/LESSON_STACK_SCREENS/);
    expect(src).toMatch(/@helsoft\/study-buddy/);
  });

  it('anchors stack with initialRouteName (tabs) (@s16)', () => {
    const src = readFileSync(appRoute('_layout.tsx'), 'utf8');
    expect(src).toMatch(/unstable_settings/);
    expect(src).toMatch(/initialRouteName:\s*['"]\(tabs\)['"]/);
    expect(existsSync(tabsRoute('index.tsx'))).toBe(true);
    expect(existsSync(tabsRoute('pdf-files.tsx'))).toBe(true);
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

  it('(tabs)/settings/index.tsx exists — Settings screen at /settings', () => {
    expect(existsSync(tabsRoute('settings/index.tsx'))).toBe(true);
  });

  it('(tabs)/settings/api-keys.tsx exists — API keys screen at /settings/api-keys', () => {
    expect(existsSync(tabsRoute('settings/api-keys.tsx'))).toBe(true);
  });
});
