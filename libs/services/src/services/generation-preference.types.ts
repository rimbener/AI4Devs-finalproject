import type { AiProvider } from '@helsoft/types';

/** Last-used generation provider+model persisted on device (spec.md Open decision). */
export type GenerationPreference = {
  provider: AiProvider;
  model: string;
};
