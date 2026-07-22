import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { configureBreakpointMock } from '../../../.storybook/mocks/hooks';
import { SettingsSignOut } from './settings-sign-out';

const meta = {
  title: 'Features/SettingsSignOut',
  component: SettingsSignOut,
} satisfies Meta<typeof SettingsSignOut>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mobile — uncontrolled SignOut trigger on Settings. */
export const Mobile: Story = {
  render: () => {
    configureBreakpointMock('mobile');
    return <SettingsSignOut />;
  },
};

/** Desktop — renders nothing (AccountMenu owns sign-out). */
export const Desktop: Story = {
  render: () => {
    configureBreakpointMock('desktop');
    return (
      <View>
        <Text>Desktop Settings (no Sign out here)</Text>
        <SettingsSignOut />
      </View>
    );
  },
};

/** Content — same as Mobile (sign-out visible). */
export const Content: Story = {
  render: () => {
    configureBreakpointMock('mobile');
    return <SettingsSignOut />;
  },
};

/** Empty desktop shell — confirms null branch. */
export const Empty: Story = {
  render: () => {
    configureBreakpointMock('desktop');
    return <SettingsSignOut />;
  },
};
