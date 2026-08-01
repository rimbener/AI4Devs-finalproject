import type { ReactNode, RefObject } from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';

/** Ref to the ScrollView an owning layout exposes to its descendants. */
export type ScrollViewRef = RefObject<ScrollView | null>;

/** Renders a ScrollView (props pass through) and provides its ref via context. */
export type ScrollViewProviderProps = ScrollViewProps & { children: ReactNode };
