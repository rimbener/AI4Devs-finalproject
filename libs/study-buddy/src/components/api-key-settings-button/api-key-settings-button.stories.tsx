import type { ApiKeyStatus } from '@helsoft/types';
import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';

import { configureApiKeyMock, configureProfileMock } from '../../../.storybook/mocks/hooks';
import { ApiKeySettingsButton } from './api-key-settings-button';

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
  title: 'Features/ApiKeySettingsButton',
  component: ApiKeySettingsButton,
} satisfies Meta<typeof ApiKeySettingsButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const emptyApiKeyStatus: ApiKeyStatus = { keys: [] };
const groqApiKeyStatus: ApiKeyStatus = {
  keys: [{ provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' }],
};

/** Entry — Show API keys settings button (free plan). */
export const Entry: Story = {
  decorators: [
    withProfileMock({ profile: FREE_PROFILE }),
    withApiKeyMock({ status: emptyApiKeyStatus }),
  ],
};

/** Loading — plan-sensitive entry hidden while entitlements load. */
export const Loading: Story = {
  decorators: [
    withProfileMock({ profile: null, isLoading: true }),
    withApiKeyMock({ status: emptyApiKeyStatus }),
  ],
};

/** Paid — BYOK entry stays hidden even if a key remains saved. */
export const Paid: Story = {
  decorators: [
    withProfileMock({
      profile: {
        plan: 'paid',
        keySource: 'platform',
        showKeySettings: false,
        showAds: false,
        canCreate: true,
      },
    }),
    withApiKeyMock({
      status: groqApiKeyStatus,
    }),
  ],
};

/** Profile error — entry hidden with retry. */
export const ProfileError: Story = {
  decorators: [
    withProfileMock({
      profile: null,
      error: new globalThis.Error('read failed'),
    }),
    withApiKeyMock({ status: emptyApiKeyStatus }),
  ],
};
