import { useBreakpoint } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { AppChrome } from '@helsoft/study-buddy';
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
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('nav.myLessons')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="menu_book" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('nav.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
