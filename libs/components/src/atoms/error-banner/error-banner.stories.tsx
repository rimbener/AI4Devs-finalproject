import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ErrorBanner } from './error-banner';

const meta = {
  title: 'Atoms/ErrorBanner',
  component: ErrorBanner,
  args: {
    errorMessage: 'Something went wrong. Please try again.',
  },
} satisfies Meta<typeof ErrorBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    errorMessage:
      'We could not save your changes because the connection was interrupted. Check your network and try again.',
  },
};
