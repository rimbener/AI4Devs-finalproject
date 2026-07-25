import { AccessibilityInfo, type HostInstance } from 'react-native';

/** Returns false on targets where `AccessibilityInfo.sendAccessibilityEvent` is missing (e.g. RN Web). */
export const sendAccessibilityEvent = (host: HostInstance): boolean => {
  const nativeSendAccessibilityEvent = AccessibilityInfo.sendAccessibilityEvent;
  if (typeof nativeSendAccessibilityEvent !== 'function') return false;

  nativeSendAccessibilityEvent.call(AccessibilityInfo, host, 'focus');
  return true;
};
