import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ErrorMessageWithRetry } from './error-message-with-retry';

const meta = {
  title: 'Molecules/ErrorMessageWithRetry',
  component: ErrorMessageWithRetry,
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorMessageWithRetry>;

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
