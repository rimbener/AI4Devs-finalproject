import { createContext, useContext, useRef } from 'react';
import { ScrollView } from 'react-native';

import type { ScrollViewProviderProps, ScrollViewRef } from './scroll-view-provider.types';

const ScrollViewRefContext = createContext<ScrollViewRef | null>(null);

/**
 * Renders a ScrollView and exposes its ref to descendants (e.g. the activity
 * footer) so they can scroll content into view without knowing the scroll
 * container. ScrollView props pass through; `children` become its content.
 */
export const ScrollViewProvider = ({ children, ...scrollViewProps }: ScrollViewProviderProps) => {
  const scrollViewRef = useRef<ScrollView | null>(null);

  return (
    <ScrollViewRefContext.Provider value={scrollViewRef}>
      <ScrollView {...scrollViewProps} ref={scrollViewRef}>
        {children}
      </ScrollView>
    </ScrollViewRefContext.Provider>
  );
};

/** Nearest enclosing ScrollView ref, or null when none is provided. */
export const useScrollViewRef = (): ScrollViewRef | null => useContext(ScrollViewRefContext);
