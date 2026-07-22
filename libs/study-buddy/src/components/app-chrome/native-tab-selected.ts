export type NativeTabName = 'index' | 'settings';

/**
 * Maps the active route to whether a NativeTabs trigger is AT-selected (@s5).
 * NativeTabs applies selection natively; this is the testable route→selected contract
 * (Trigger is config-only / renders null, so RNTL can't assert on the layout).
 */
export function isNativeTabSelected(pathname: string, tab: NativeTabName): boolean {
  if (tab === 'settings') return pathname === '/settings';
  return pathname === '/' || pathname === '';
}
