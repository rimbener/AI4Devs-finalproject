import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { SUBMIT_SLIDE_DISTANCE } from './activity-submit-result.helpers';

/**
 * Activity footer entrance animation: slides the visible content (submit button
 * or result) up from the bottom, replaying the slide whenever the visible mode
 * switches. Pure presentation — no interaction state lives here.
 */
export const useActivitySubmitResultAnimations = (renderMode: 'hidden' | 'submit' | 'result') => {
  const { theme } = useUnistyles();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (renderMode === 'hidden') return;
    anim.setValue(0);
    const timing = Animated.timing(anim, {
      toValue: 1,
      duration: theme.duration.medium4,
      easing: theme.easing.emphasizedDecelerate,
      useNativeDriver: Platform.OS !== 'web',
    });
    timing.start();
    return () => timing.stop();
  }, [anim, renderMode, theme]);

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
