import type { ReactNode } from 'react';

export type ApiKeyGateProps = {
  /** Screen content under the gate. Creation is gated by `useCanCreate()` (`keySource === 'platform' || hasKey`). */
  children: ReactNode;
};
