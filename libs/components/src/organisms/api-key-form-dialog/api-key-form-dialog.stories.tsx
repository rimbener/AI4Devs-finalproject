import type { AiProvider } from '@helsoft/types';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { ApiKeyFormDialog } from './api-key-form-dialog';
import type { ApiKeyFormDialogProps } from './api-key-form-dialog.types';

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

// Canonical catalog order, mirrored from `providerNames` above — replaces the deleted hardcoded
// provider-id constant (task-11).
const ALL_PROVIDERS = Object.keys(providerNames) as AiProvider[];

const guidanceUrls: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/app/apikey',
  xai: 'https://console.x.ai',
  deepseek: 'https://platform.deepseek.com/api_keys',
};

const InteractiveAdd = (args: ApiKeyFormDialogProps) => {
  const [formProvider, setFormProvider] = useState<AiProvider | null>(args.formProvider);
  const [apiKey, setApiKey] = useState(args.apiKey);

  return (
    <ApiKeyFormDialog
      {...args}
      formProvider={formProvider}
      apiKey={apiKey}
      onApiKeyChange={setApiKey}
      onSelectProvider={(provider) => {
        setFormProvider(provider);
        setApiKey('');
      }}
      isSaveDisabled={args.isSubmitting === true || !formProvider || !apiKey.trim()}
    />
  );
};

const meta = {
  title: 'Organisms/ApiKeyFormDialog',
  component: ApiKeyFormDialog,
  args: {
    open: true,
    onClose: () => {},
    formMode: 'add',
    formProvider: null,
    unsavedProviders: ALL_PROVIDERS,
    apiKey: '',
    onApiKeyChange: () => {},
    onSelectProvider: () => {},
    isSubmitting: false,
    isSaveDisabled: true,
    onSave: () => {},
    guidanceUrls,
    providerNames,
  },
  render: (args) => <InteractiveAdd {...args} />,
} satisfies Meta<typeof ApiKeyFormDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Add — open modal, no provider selected yet. */
export const Add: Story = {};

/** Add with provider — key field + guidance link. */
export const AddWithProvider: Story = {
  args: {
    formProvider: 'groq',
    apiKey: '',
    isSaveDisabled: true,
  },
};

/** Replace — fixed provider, no radio group. */
export const Replace: Story = {
  args: {
    formMode: 'replace',
    formProvider: 'openai',
    unsavedProviders: [],
    isSaveDisabled: true,
  },
  render: (args) => <ApiKeyFormDialog {...args} />,
};

/** Submitting — Save disabled + saving label. */
export const Submitting: Story = {
  args: {
    formMode: 'replace',
    formProvider: 'groq',
    apiKey: 'sk-draft',
    isSubmitting: true,
    isSaveDisabled: true,
  },
  render: (args) => <ApiKeyFormDialog {...args} />,
};
