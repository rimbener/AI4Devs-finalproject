import type { ApiKeyStatus } from '@helsoft/types';
import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';

import { configureApiKeyMock, configureProfileMock } from '../../../.storybook/mocks/hooks';
import { ApiKeySettingsScreen } from './api-key-settings-screen';

const FREE_PROFILE = {
  plan: 'free' as const,
  keySource: 'user' as const,
  showKeySettings: true,
  showAds: true,
  canCreate: false,
};

const withApiKeyMock =
  (config: Parameters<typeof configureApiKeyMock>[0]): Decorator =>
  (StoryFn) => {
    configureApiKeyMock(config);
    return <StoryFn />;
  };

const withProfileMock =
  (config: Parameters<typeof configureProfileMock>[0]): Decorator =>
  (StoryFn) => {
    configureProfileMock(config);
    return <StoryFn />;
  };

const meta = {
  title: 'Features/ApiKeySettingsScreen',
  component: ApiKeySettingsScreen,
} satisfies Meta<typeof ApiKeySettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

const emptyApiKeyStatus: ApiKeyStatus = { keys: [] };
const groqApiKeyStatus: ApiKeyStatus = {
  keys: [{ provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' }],
};

/** Empty — no keys; Add new provider only. */
export const Empty: Story = {
  decorators: [
    withProfileMock({ profile: FREE_PROFILE }),
    withApiKeyMock({ status: emptyApiKeyStatus }),
  ],
};

/** Saved — masked saved row + Add still available. */
export const Saved: Story = {
  decorators: [
    withProfileMock({
      profile: { ...FREE_PROFILE, canCreate: true },
    }),
    withApiKeyMock({
      status: groqApiKeyStatus,
    }),
  ],
};

/** Network error banner. */
export const NetworkError: Story = {
  decorators: [
    withProfileMock({ profile: FREE_PROFILE }),
    withApiKeyMock({ status: emptyApiKeyStatus, error: 'network_error' }),
  ],
};
