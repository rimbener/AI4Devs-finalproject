import { isNativeTabSelected } from './native-tab-selected';

// @s5 — current tab exposed as selected to assistive technology (route → selected map).
// NativeTabs.Trigger renders null (config-only), so RNTL can't assert AT selected on the
// layout; this helper is the testable contract for which trigger is selected.
describe('isNativeTabSelected (@s5)', () => {
  it('marks index selected on / and settings unselected', () => {
    expect(isNativeTabSelected('/', 'index')).toBe(true);
    expect(isNativeTabSelected('/', 'settings')).toBe(false);
  });

  it('marks settings selected on /settings and index unselected', () => {
    expect(isNativeTabSelected('/settings', 'settings')).toBe(true);
    expect(isNativeTabSelected('/settings', 'index')).toBe(false);
  });

  it('exposes accessibilityState.selected shape for the active route', () => {
    const indexState = { selected: isNativeTabSelected('/', 'index') };
    const settingsState = { selected: isNativeTabSelected('/', 'settings') };
    expect(indexState).toEqual({ selected: true });
    expect(settingsState).toEqual({ selected: false });
  });
});
