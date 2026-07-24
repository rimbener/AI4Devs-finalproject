import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ApiKeyManager } from './api-key-manager';
import type { ApiKeyManagerProps } from './api-key-manager.types';

const providerNameKeys: Record<AiProvider, string> = {
  groq: 'settings.apiKey.provider.groq',
  openai: 'settings.apiKey.provider.openai',
  anthropic: 'settings.apiKey.provider.anthropic',
  google: 'settings.apiKey.provider.google',
  xai: 'settings.apiKey.provider.xai',
  deepseek: 'settings.apiKey.provider.deepseek',
};

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

const guidanceUrls: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/app/apikey',
  xai: 'https://console.x.ai',
  deepseek: 'https://platform.deepseek.com/api_keys',
};

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${providerNames[provider]} key saved · Updated ${new Date(updatedAt).toLocaleDateString('en')}`;

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };

const sharedArgs: Omit<ApiKeyManagerProps, 'savedKeys'> = {
  onSave: () => {},
  onRemove: () => {},
  guidanceUrls,
  getSavedStatusLabel,
  providerNameKeys,
};

const meta = {
  title: 'Organisms/ApiKeyManager',
  component: ApiKeyManager,
  args: {
    ...sharedArgs,
    savedKeys: [],
  },
} satisfies Meta<typeof ApiKeyManager>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty — message + Add new provider button only. */
export const Empty: Story = {};

/** Content — one saved key + Add new provider still available. */
export const Content: Story = {
  args: {
    savedKeys: [groqKey],
  },
};

/** All saved — Add button hidden. */
export const AllSaved: Story = {
  args: {
    savedKeys: [
      { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
      { provider: 'anthropic', updatedAt: '2026-03-01T00:00:00.000Z' },
      { provider: 'google', updatedAt: '2026-04-01T00:00:00.000Z' },
      { provider: 'xai', updatedAt: '2026-05-01T00:00:00.000Z' },
      { provider: 'deepseek', updatedAt: '2026-06-01T00:00:00.000Z' },
    ],
  },
};

/** Loading — initial status fetch in flight. */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/** Error — banner with saved row still visible. */
export const Error: Story = {
  args: {
    savedKeys: [groqKey],
    errorMessage: "Couldn't reach the server. Try again.",
  },
};
