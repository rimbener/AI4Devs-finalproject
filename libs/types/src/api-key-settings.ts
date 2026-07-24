import type { AiProvider } from './ai-provider';

/** Provider brand names via i18n keys. */
export const PROVIDER_NAME_KEYS: Record<AiProvider, string> = {
  groq: 'settings.apiKey.provider.groq',
  openai: 'settings.apiKey.provider.openai',
  anthropic: 'settings.apiKey.provider.anthropic',
  google: 'settings.apiKey.provider.google',
  xai: 'settings.apiKey.provider.xai',
  deepseek: 'settings.apiKey.provider.deepseek',
};

/** Per-provider API-key console guidance URLs. */
export const API_KEY_SETTINGS_GUIDANCE_URLS: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  google: 'https://aistudio.google.com/app/apikey',
  xai: 'https://console.x.ai',
  deepseek: 'https://platform.deepseek.com/api_keys',
};
