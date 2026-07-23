import { useLocalization } from '@helsoft/localization';
import { NATIVE_TAB_TRIGGERS } from '@helsoft/study-buddy';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const { t } = useLocalization();

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
