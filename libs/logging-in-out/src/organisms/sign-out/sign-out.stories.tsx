import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { SignOut } from './sign-out';

const SIGN_OUT_DELAY_MS = 300;

const meta = {
  title: 'Organisms/SignOut',
  component: SignOut,
  args: {
    isSigningOut: false,
    error: null,
    onSignOut: () => setTimeout(() => {}, SIGN_OUT_DELAY_MS),
    onSignOutError: () => undefined,
  },
} satisfies Meta<typeof SignOut>;

export default meta;

type Story = StoryObj<typeof meta>;

// Trigger + live confirm/cancel; onSignOut is fire-and-forget (mirrors mutate).
export const Default: Story = {};

export const WithStyle: Story = {
  args: {
    style: { marginRight: 10, marginTop: 10, backgroundColor: 'red' },
  },
};

// Error dialog open: retry resets + signs out again; cancel only clears error.
export const WithError: Story = {
  args: {
    error: 'network_error',
  },
};
