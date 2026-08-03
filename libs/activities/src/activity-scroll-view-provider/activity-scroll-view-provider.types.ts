import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import type { LayoutChangeEvent, ScrollViewProps } from 'react-native';

/**
 * Data the pinned footer host renders. Kept as state (not a React element) so the
 * host is registered once and only this data changes on parent re-renders — the
 * node never remounts, so its entrance animation doesn't replay and result child
 * state (e.g. collapse) survives.
 */
export type ActivityFooterData = {
  renderMode: 'submit' | 'result';
  hasResult: boolean;
  children: ReactNode;
  submitTestID?: string;
  resultTestID?: string;
};

/** Registers/unregisters the pinned footer below the ScrollView. */
export type ActivityFooterSetter = Dispatch<SetStateAction<ActivityFooterData | null>>;

/** Footer context value: data registration, handler ref, forward action, and Next visibility. */
export type ActivityFooterContextValue = {
  setFooterData: ActivityFooterSetter;
  /** Registers the submit handler so the pinned button always reads the latest one. */
  onSubmitRef: RefObject<() => void>;
  /** Toggles the shared pinned Next button (defaults to visible, e.g. instructional slides). */
  setNextVisible: (visible: boolean) => void;
  /** Advances to the next step; undefined when the provider has no forward action. */
  onNext?: (() => void) | undefined;
};

/** Renders a ScrollView (props pass through) and hosts the activity footer below it. */
export type ActivityScrollViewProviderProps = ScrollViewProps & {
  children: ReactNode;
  /** Applied to the wrapper frame instead of the ScrollView (stable body height). */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** testID forwarded to the wrapper frame. */
  wrapperTestID?: string;
  /** Forward action exposed to the pinned activity footer (e.g. lesson goNext). */
  onFooterNext?: () => void;
};
