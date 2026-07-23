import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { WebBottomTabButton } from '../../molecules/web-bottom-tab-button/web-bottom-tab-button';
import type { WebBottomTabsProps } from './web-bottom-tabs.types';

/**
 * Narrow-web tab shell: headless `expo-router/ui` Tabs with a Material-style
 * bottom bar (NativeTabs web chrome sits at the top and looks wrong).
 *
 * Sticky Unistyles live on a View via `TabList asChild` — wrapping `TabList` in
 * a plain View breaks Expo's screen discovery ("Couldn't find any screens").
 */
export const WebBottomTabs = ({ triggers }: WebBottomTabsProps) => (
  <View style={styles.root} testID="web-bottom-tabs">
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={styles.tabBar} testID="tab-list">
          {triggers.map((tab) => (
            <TabTrigger key={tab.name} asChild href={tab.href} name={tab.name}>
              <WebBottomTabButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  </View>
);

const styles = StyleSheet.create((theme) => {
  const tabBarReserve =
    theme.layout.touchTarget + theme.typography.labelMedium.lineHeight + theme.spacing.s4;

  return {
    root: {
      flex: 1,
      width: '100%',
      _web: {
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
      },
    },
    tabs: {
      flex: 1,
    },
    slot: {
      flex: 1,
      minHeight: 0,
      _web: {
        paddingBottom: tabBarReserve,
      },
    },
    tabBar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: theme.colors.surfaceContainer,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
      paddingBottom: theme.spacing.s2,
      paddingTop: theme.spacing.s1,
      _web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      },
    },
  };
});
