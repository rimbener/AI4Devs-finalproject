import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ErrorScreen } from './error-screen';

const meta = {
  title: 'Templates/ErrorScreen',
  component: ErrorScreen,
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default English copy when no messageKey is provided. */
export const Default: Story = {};

/** Localized message + retry labels via keys. */
export const WithKeys: Story = {
  args: {
    messageKey: 'entitlements.error.message',
    retryKey: 'entitlements.error.retry',
  },
};
