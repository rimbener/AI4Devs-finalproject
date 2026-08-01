import { spacing } from '@helsoft/components';
import { Platform } from 'react-native';

import type { ScrollViewRef } from '../../scroll-view-provider/scroll-view-provider.types';

/** Host node capabilities the scroll helper relies on (structural subset of View/DOM). */
export type ScrollableHost = {
  getDOMNode?: () => { scrollIntoView?: (options: ScrollIntoViewOptions) => void } | null;
  scrollIntoView?: (options: ScrollIntoViewOptions) => void;
  measureLayout?(
    relativeTo: unknown,
    onSuccess: (left: number, top: number, width: number, height: number) => void,
    onFail: () => void,
  ): void;
};

type ScrollIntoViewOptions = { block: 'nearest'; behavior: 'smooth' };

/**
 * Bring a footer node (submit button or result content) fully into view.
 * Web: DOM scrollIntoView (RNW host nodes — walks nearest scrollable ancestors,
 * including nested ScrollView divs). Native: measure the node against the owning
 * ScrollView's native element (Fabric requires a host ref, not a node handle)
 * and scrollTo the content offset.
 */
export const scrollNodeIntoView = (
  node: ScrollableHost | null,
  scrollViewRef: ScrollViewRef | null,
): void => {
  if (!node) return;

  if (Platform.OS === 'web') {
    const domNode = node.getDOMNode?.() ?? node;
    domNode?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  const scrollView = scrollViewRef?.current;
  if (!scrollView) return;

  const relativeTo = scrollView.getNativeScrollRef?.() ?? null;
  if (relativeTo == null || typeof node.measureLayout !== 'function') return;

  node.measureLayout(
    relativeTo,
    (_left, top) => {
      scrollView.scrollTo?.({ y: top, animated: true });
    },
    () => {},
  );
};

/** Vertical distance (md: 24px) the footer slides up from on entry. */
export const SUBMIT_SLIDE_DISTANCE = spacing.s6;
