import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { configureSignOutMock } from '../../../.storybook/mocks/hooks';
import { SignOut } from './sign-out';

const meta = {
  title: 'Features/SignOut',
  component: SignOut,
} satisfies Meta<typeof SignOut>;

export default meta;

type Story = StoryObj<typeof meta>;

// Trigger + confirm/cancel; fake useSignOut().signOut is fire-and-forget, isSigningOut
// flips back after a short delay (see .storybook/mocks/hooks.ts).
export const Default: Story = {};

export const WithStyle: Story = {
  args: {
    style: { marginRight: 10, marginTop: 10, backgroundColor: 'red' },
  },
};

export const WithError: Story = {
  decorators: [
    (Story) => {
      configureSignOutMock({ error: 'network_error' });
      return <Story />;
    },
  ],
};

export const NetworkErrorOnConfirm: Story = {
  decorators: [
    (Story) => {
      configureSignOutMock({ scenario: 'networkError' });
      return <Story />;
    },
  ],
};
