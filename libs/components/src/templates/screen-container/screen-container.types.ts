import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import type { Edges } from 'react-native-safe-area-context';

export type ScreenContainerProps = ViewProps & {
  children: ReactNode;
  /**
   * Which sides get safe-area inset padding. Defaults to all four. Screens that already
   * sit under a native header (which consumes the top inset itself) should exclude `'top'`
   * to avoid double-padding.
   */
  edges?: Edges;
};
