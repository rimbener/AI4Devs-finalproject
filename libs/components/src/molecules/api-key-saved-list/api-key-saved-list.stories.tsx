import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ApiKeySavedList } from './api-key-saved-list';

const providers: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

const getSavedStatusLabel = (provider: AiProvider, updatedAt: string) =>
  `${providerNames[provider]} key saved · Updated ${new Date(updatedAt).toLocaleDateString('en')}`;

const groqKey: SavedProviderKey = { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' };
const openaiKey: SavedProviderKey = { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' };

const meta = {
  title: 'Molecules/ApiKeySavedList',
  component: ApiKeySavedList,
  args: {
    savedKeys: [groqKey],
    providers,
    savedProviders: new Set<AiProvider>(['groq']),
    getSavedStatusLabel,
    providerNames,
    isSubmitting: false,
    onReplace: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof ApiKeySavedList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One saved provider row. */
export const Single: Story = {};

/** Multiple saved providers in registry order. */
export const Multiple: Story = {
  args: {
    savedKeys: [openaiKey, groqKey],
    savedProviders: new Set<AiProvider>(['groq', 'openai']),
  },
};

/** Submitting — Replace/Remove disabled. */
export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};
