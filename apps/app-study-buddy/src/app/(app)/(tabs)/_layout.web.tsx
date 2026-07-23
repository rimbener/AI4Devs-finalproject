import { WebBottomTabs } from '@helsoft/components';
import { useBreakpoint } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { AppChrome, NATIVE_TAB_TRIGGERS } from '@helsoft/study-buddy';
import { Slot } from 'expo-router';

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

  // NativeTabs on web renders a top chrome; use headless Tabs + Material bottom bar.
  return (
    <WebBottomTabs
      triggers={NATIVE_TAB_TRIGGERS.map((tab) => ({
        name: tab.name,
        href: tab.href,
        label: t(tab.labelKey),
        icon: tab.md,
      }))}
    />
  );
}
