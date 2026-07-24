/**
 * The supported AI-provider union (spec.md Open decision 2 — multi-provider-ai-keys).
 * Six providers in fixed canonical order: groq, openai, anthropic, google, xai, deepseek.
 * Hand-mirrored from @helsoft/types AI_PROVIDERS (task-4 parity note — keep in sync).
 */
export type AiProvider = 'groq' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

/** The closed allow-list index.ts checks body.provider against before dispatch — a
 * truthiness check alone would let any non-empty string reach the RPCs (full review
 * round 1, Minor 11). */
const AI_PROVIDERS: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

export const isAiProvider = (value: unknown): value is AiProvider =>
  typeof value === 'string' && (AI_PROVIDERS as readonly string[]).includes(value);
