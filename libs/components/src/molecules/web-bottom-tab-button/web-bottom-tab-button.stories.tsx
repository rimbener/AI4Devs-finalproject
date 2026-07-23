import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { WebBottomTabButton } from './web-bottom-tab-button';

const meta = {
  title: 'Molecules/WebBottomTabButton',
  component: WebBottomTabButton,
  decorators: [
    (Story) => (
      <View style={{ flexDirection: 'row', width: 360, backgroundColor: '#1c1b1f' }}>
        <Story />
      </View>
    ),
  ],
  args: {
    icon: 'menu_book',
    label: 'My lessons',
    onPress: () => undefined,
  },
} satisfies Meta<typeof WebBottomTabButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unfocused: Story = {
  args: { isFocused: false },
};

export const Focused: Story = {
  args: { isFocused: true },
};

export const SettingsFocused: Story = {
  args: { icon: 'settings', label: 'Settings', isFocused: true },
};
