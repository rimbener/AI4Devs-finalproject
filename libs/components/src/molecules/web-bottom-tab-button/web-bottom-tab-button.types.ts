import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { Ref } from 'react';
import type { View } from 'react-native';

export type WebBottomTabButtonProps = TabTriggerSlotProps & {
  icon: string;
  label: string;
  ref?: Ref<View>;
};
