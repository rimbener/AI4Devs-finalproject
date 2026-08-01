import { useEffect, useRef } from 'react';
import type { View } from 'react-native';

import { useScrollViewRef } from '../../scroll-view-provider/scroll-view-provider';
import { scrollNodeIntoView } from './activity-submit-result.helpers';
import { useActivitySubmitResultAnimations } from './use-activity-submit-result.animations';

/**
 * Activity footer interaction: replays the slide-up entrance whenever the
 * visible content switches between the submit button and the result, and scrolls
 * whichever node just appeared (submit button or result) fully into view.
 */
export const useActivitySubmitResult = (hasResult: boolean, canSubmit: boolean) => {
  const submitRef = useRef<View | null>(null);
  const resultRef = useRef<View | null>(null);
  const scrollViewRef = useScrollViewRef();
  const renderMode = hasResult ? 'result' : canSubmit ? 'submit' : 'hidden';
  const prevMode = useRef(renderMode);

  const { animatedStyle } = useActivitySubmitResultAnimations(renderMode);

  useEffect(() => {
    const prev = prevMode.current;
    prevMode.current = renderMode;
    if (renderMode === prev) return;
    if (renderMode === 'result') {
      scrollNodeIntoView(resultRef.current, scrollViewRef);
    } else if (renderMode === 'submit') {
      scrollNodeIntoView(submitRef.current, scrollViewRef);
    }
  }, [renderMode, scrollViewRef]);

  return { submitRef, resultRef, animatedStyle };
};
