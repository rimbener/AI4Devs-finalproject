import { AccessibilityInfo, type HostInstance } from 'react-native';

import { sendAccessibilityEvent } from './send-accessibility-event';

const host = {} as HostInstance;

describe('sendAccessibilityEvent', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the native sendAccessibilityEvent with the host and "focus", and returns true', () => {
    const nativeSendAccessibilityEvent = jest.fn();
    jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(nativeSendAccessibilityEvent);

    const result = sendAccessibilityEvent(host);

    expect(nativeSendAccessibilityEvent).toHaveBeenCalledWith(host, 'focus');
    expect(result).toBe(true);
  });

  it('returns false without throwing when sendAccessibilityEvent is missing on the target', () => {
    const original = AccessibilityInfo.sendAccessibilityEvent;
    // @ts-expect-error — simulating a target (e.g. RN Web) where this native method is absent.
    AccessibilityInfo.sendAccessibilityEvent = undefined;

    const result = sendAccessibilityEvent(host);

    AccessibilityInfo.sendAccessibilityEvent = original;
    expect(result).toBe(false);
  });
});
