jest.mock('@helsoft/rn-utils', () => ({ sendAccessibilityEvent: jest.fn() }));

import { sendAccessibilityEvent } from '@helsoft/rn-utils';
import type { RefObject } from 'react';
import type { View } from 'react-native';

import { focusDialog } from './image-lightbox.helpers';

const mockSendAccessibilityEvent = sendAccessibilityEvent as jest.Mock;

describe('focusDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing when the ref has no current host', () => {
    const ref = { current: null } as RefObject<View | null>;

    focusDialog(ref);

    expect(mockSendAccessibilityEvent).not.toHaveBeenCalled();
  });

  it('does not fall back to host.focus() when the native event succeeds', () => {
    const focus = jest.fn();
    mockSendAccessibilityEvent.mockReturnValue(true);
    const host = { focus };
    const ref = { current: host } as unknown as RefObject<View | null>;

    focusDialog(ref);

    expect(mockSendAccessibilityEvent).toHaveBeenCalledWith(host);
    expect(focus).not.toHaveBeenCalled();
  });

  it('falls back to host.focus() when the native event is unavailable (e.g. RN Web)', () => {
    const focus = jest.fn();
    mockSendAccessibilityEvent.mockReturnValue(false);
    const host = { focus };
    const ref = { current: host } as unknown as RefObject<View | null>;

    focusDialog(ref);

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the native event fails and the host has no focus()', () => {
    mockSendAccessibilityEvent.mockReturnValue(false);
    const ref = { current: {} } as unknown as RefObject<View | null>;

    expect(() => focusDialog(ref)).not.toThrow();
  });
});
