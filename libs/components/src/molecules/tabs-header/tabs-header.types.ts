import type { ReactNode } from 'react';

export type TabsHeaderProps = {
  title: string;
  /** Optional trailing action (e.g. Button, dialog trigger). */
  children?: ReactNode;
};
