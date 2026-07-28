// Provider → createX(apiKey) factory behind the generation/vision seams (task-9).
// Live-verify note: npm:@ai-sdk/* imports are Deno-only — not Jest/Stryker-testable here.
import { createAnthropic } from 'npm:@ai-sdk/anthropic@4';
// @ai-sdk/deepseek has no v4 package yet — latest is 3.x (ProviderV4-compatible).
import { createDeepSeek } from 'npm:@ai-sdk/deepseek@3';
import { createGoogleGenerativeAI } from 'npm:@ai-sdk/google@4';
import { createGroq } from 'npm:@ai-sdk/groq@4';
import { createOpenAI } from 'npm:@ai-sdk/openai@4';
import { createXai } from 'npm:@ai-sdk/xai@4';

import { type AiProvider, PLATFORM_TEXT_MODEL_ID } from './models.ts';

export type ProviderModelCall = (modelId: string) => unknown;

// AiProvider is now a plain string (ai-provider-registry-backend, D6), so `providerCreators[provider]`
// below can be `undefined` for a catalog row with no wired factory here — an accepted risk (D7,
// risks.md R4): it surfaces as an opaque `generation_failed` 502 rather than a guarded rejection.
// All six seeded providers have a factory today; this only bites a future catalog-only addition.
const providerCreators: Record<
  AiProvider,
  (options: { apiKey: string }) => (modelId: string) => unknown
> = {
  groq: createGroq,
  openai: createOpenAI,
  anthropic: createAnthropic,
  google: createGoogleGenerativeAI,
  xai: createXai,
  deepseek: createDeepSeek,
};

/** Returns a callable that wraps the provider SDK model selector for the given apiKey. */
export const createProviderModel = (
  provider: AiProvider,
  apiKey: string,
): ((modelId: string) => unknown) => {
  const client = providerCreators[provider]({ apiKey });
  return (modelId: string) => client(modelId);
};

/** Platform path always uses Groq + the default text model (@s19). */
export const createPlatformTextModel = (apiKey: string) =>
  createProviderModel('groq', apiKey)(PLATFORM_TEXT_MODEL_ID);
