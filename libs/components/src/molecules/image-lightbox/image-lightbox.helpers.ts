import { sendAccessibilityEvent } from '@helsoft/rn-utils';
import type { RefObject } from 'react';
import type { View } from 'react-native';

type FocusableHost = View & { focus?: () => void };

/**
 * Move a11y/keyboard focus onto a host ref.
 * Native: AccessibilityInfo.sendAccessibilityEvent (missing on RN Web).
 * Web fallback: host.focus() when present.
 */
export const focusDialog = (dialogRef: RefObject<View | null>) => {
  const host = dialogRef.current as FocusableHost | null;
  if (!host) return;

  if (sendAccessibilityEvent(host)) return;

  host.focus?.();
};
