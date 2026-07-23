import type { Href } from 'expo-router';

/** Presentational tab trigger — caller supplies translated label + Material icon. */
export type WebBottomTabTrigger = {
  name: string;
  href: Href;
  label: string;
  icon: string;
};

export type WebBottomTabsProps = {
  triggers: readonly WebBottomTabTrigger[];
};
