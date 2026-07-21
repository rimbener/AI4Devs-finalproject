import type { RefObject } from 'react';
import { AccessibilityInfo, type View } from 'react-native';

type FocusableHost = View & { focus?: () => void };

/**
 * Move a11y/keyboard focus onto a host ref.
 * Native: AccessibilityInfo.sendAccessibilityEvent (missing on RN Web).
 * Web fallback: host.focus() when present.
 */
export const focusDialog = (dialogRef: RefObject<View | null>) => {
  const host = dialogRef.current as FocusableHost | null;
  if (!host) return;

  const sendAccessibilityEvent = AccessibilityInfo.sendAccessibilityEvent;
  if (typeof sendAccessibilityEvent === 'function') {
    sendAccessibilityEvent.call(AccessibilityInfo, host, 'focus');
    return;
  }

  host.focus?.();
};
