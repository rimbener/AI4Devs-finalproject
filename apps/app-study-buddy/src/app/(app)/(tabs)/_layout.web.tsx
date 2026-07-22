import { useBreakpoint } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { AppChrome, NATIVE_TAB_TRIGGERS } from '@helsoft/study-buddy';
import { Slot } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsWebLayout() {
  const breakpoint = useBreakpoint();
  const { t } = useLocalization();

  if (breakpoint === 'desktop') {
    return (
      <>
        <AppChrome />
        <Slot />
      </>
    );
  }

  return (
    <NativeTabs>
      {NATIVE_TAB_TRIGGERS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
