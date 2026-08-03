import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { SUBMIT_SLIDE_DISTANCE } from './activity-result-panel.helpers';

/**
 * Activity footer entrance animation: slides the visible content (submit button
 * or result) up from the bottom, replaying the slide whenever the visible mode
 * switches. Pure presentation — no interaction state lives here.
 */
export const useActivityResultPanelAnimations = (renderMode: 'hidden' | 'submit' | 'result') => {
  const { theme } = useUnistyles();
  const anim = useRef(new Animated.Value(0)).current;
  // Duration/easing tokens are static — capture them once so the effect only
  // depends on the mode. `useUnistyles().theme` is a fresh Proxy on every render,
  // so depending on it would restart the slide on every re-render (e.g. each
  // keystroke in open-ended) even when the mode is unchanged.
  const timingConfig = useRef({
    duration: theme.duration.medium4,
    easing: theme.easing.emphasizedDecelerate,
  }).current;

  useEffect(() => {
    if (renderMode === 'hidden') return;
    anim.setValue(0);
    const timing = Animated.timing(anim, {
      toValue: 1,
      duration: timingConfig.duration,
      easing: timingConfig.easing,
      useNativeDriver: Platform.OS !== 'web',
    });
    timing.start();
    return () => timing.stop();
  }, [anim, renderMode, timingConfig]);

  const animatedStyle = useMemo(
    () => ({
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [SUBMIT_SLIDE_DISTANCE, 0],
          }),
        },
      ],
    }),
    [anim],
  );

  return { animatedStyle };
};
