import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { configureSessionMock } from '../../../.storybook/mocks/hooks';
import { AppChrome } from './app-chrome';

const meta = {
  title: 'Features/AppChrome',
  component: AppChrome,
} satisfies Meta<typeof AppChrome>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Content — desktop bar with My lessons + account menu (Settings / Sign out). */
export const Content: Story = {
  render: () => {
    configureSessionMock({
      session: {
        user: {
          email: 'ada@example.com',
          user_metadata: { full_name: 'Ada Lovelace' },
        },
      },
    });
    return <AppChrome />;
  },
};

/** Loading — chrome renders without a premature account identity. */
export const Loading: Story = {
  render: () => {
    configureSessionMock({ isLoading: true, session: null });
    return <AppChrome />;
  },
};
