import { useBreakpoint } from '@helsoft/hooks';

import { SignOut } from '../sign-out/sign-out';
import type { SettingsSignOutProps } from './settings-sign-out.types';

/**
 * Settings-screen Sign out — only where AccountMenu is absent (native / web <768).
 * Wide web keeps Sign out on the desktop avatar menu (@s13 / @s14).
 */
export const SettingsSignOut = (_props: SettingsSignOutProps) => {
  const breakpoint = useBreakpoint();
  if (breakpoint !== 'mobile') return null;
  return <SignOut />;
};
