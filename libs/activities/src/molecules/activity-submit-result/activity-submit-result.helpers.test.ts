import { Platform } from 'react-native';

import type { ScrollableHost } from './activity-submit-result.helpers';
import { SUBMIT_SLIDE_DISTANCE, scrollNodeIntoView } from './activity-submit-result.helpers';

const scrollableHost = (overrides: Partial<ScrollableHost> = {}): ScrollableHost =>
  overrides as ScrollableHost;

describe('scrollNodeIntoView', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it('does nothing when there is no node', () => {
    const scrollTo = jest.fn();
    scrollNodeIntoView(null, { current: { scrollTo } } as never);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls the DOM node into view on web', () => {
    Platform.OS = 'web';
    const scrollIntoView = jest.fn();
    scrollNodeIntoView(scrollableHost({ getDOMNode: () => ({ scrollIntoView }) }), null);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('falls back to the node itself when getDOMNode is unavailable on web', () => {
    Platform.OS = 'web';
    const scrollIntoView = jest.fn();
    scrollNodeIntoView(scrollableHost({ scrollIntoView }), null);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('measures against the ScrollView native element and scrolls to the content offset on native', () => {
    Platform.OS = 'ios';
    const nativeScrollNode = { tag: 7 };
    const scrollTo = jest.fn();
    const scrollViewRef = {
      current: { getNativeScrollRef: () => nativeScrollNode, scrollTo },
    };
    const measureLayout = jest.fn((_handle: unknown, onSuccess: (x: number, y: number) => void) =>
      onSuccess(0, 120),
    );
    const node = scrollableHost({ measureLayout: measureLayout as never });

    scrollNodeIntoView(node, scrollViewRef as never);

    expect(measureLayout).toHaveBeenCalledWith(
      nativeScrollNode,
      expect.any(Function),
      expect.any(Function),
    );
    expect(scrollTo).toHaveBeenCalledWith({ y: 120, animated: true });
  });

  it('skips scrolling on native when no ScrollView ref is provided', () => {
    Platform.OS = 'ios';
    const measureLayout = jest.fn();
    const node = scrollableHost({ measureLayout: measureLayout as never });

    scrollNodeIntoView(node, null);

    expect(measureLayout).not.toHaveBeenCalled();
  });

  it('skips scrolling on native when the node cannot be measured', () => {
    Platform.OS = 'ios';
    const scrollTo = jest.fn();
    const scrollViewRef = { current: { getNativeScrollRef: () => ({ tag: 7 }), scrollTo } };

    expect(() => scrollNodeIntoView({}, scrollViewRef as never)).not.toThrow();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('SUBMIT_SLIDE_DISTANCE', () => {
  it('uses the md spacing token', () => {
    expect(SUBMIT_SLIDE_DISTANCE).toBe(24);
  });
});
