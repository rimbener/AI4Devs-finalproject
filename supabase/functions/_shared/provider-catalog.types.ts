// Public contract for supabase/functions/_shared/provider-catalog.ts, split out per
// .agents/rules/types.mdc ("used in multiple files... stored in a *.types.ts file") — consumed
// by lesson-generation.validation.ts, lesson-generation.vision-model.ts, lesson-generation.route.ts,
// generate-lesson/index.ts, and their Jest fixtures. Import-free (the catalog module's "pure half",
// task-3), so it stays resolvable by Jest with zero Deno-only baggage.

export type ProviderModel = {
  modelId: string;
  label: string;
  vision: boolean;
  isVisionDefault: boolean;
  sortOrder: number;
};

export type ProviderEntry = {
  id: string;
  name: string;
  guidanceUrl: string | null;
  enabled: boolean;
  sortOrder: number;
  models: ProviderModel[];
};
