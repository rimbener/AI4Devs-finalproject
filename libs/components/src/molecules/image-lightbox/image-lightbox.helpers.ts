import type { RefObject } from 'react';
import { AccessibilityInfo, type View } from 'react-native';

export const focusDialog = (dialogRef: RefObject<View | null>) => {
  if (dialogRef.current) {
    AccessibilityInfo.sendAccessibilityEvent(dialogRef.current, 'focus');
  }
};
