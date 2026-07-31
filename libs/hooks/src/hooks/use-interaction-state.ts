import { useState } from 'react';

/** Shared hover/press/focus bookkeeping for Pressable atoms; press clears on hover-out (drag-off
 * cancel). */
export const useInteractionState = () => {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const [focus, setFocus] = useState(false);

  return {
    hover,
    press,
    focus,
    handlers: {
      onHoverIn: () => setHover(true),
      onHoverOut: () => {
        setHover(false);
        setPress(false);
      },
      onPressIn: () => setPress(true),
      onPressOut: () => setPress(false),
      onFocus: () => setFocus(true),
      onBlur: () => setFocus(false),
    },
  };
};
