import type { ProviderEntry } from '../../../../supabase/functions/_shared/provider-catalog.types';
import { resolveVisionModelForPlacement } from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.vision-model';

const withVisionDefault: ProviderEntry = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 1,
  models: [
    {
      modelId: 'text-only',
      label: 'Text Only',
      vision: false,
      isVisionDefault: false,
      sortOrder: 1,
    },
    {
      modelId: 'vision-model',
      label: 'Vision Model',
      vision: true,
      isVisionDefault: true,
      sortOrder: 2,
    },
  ],
};

const withoutVisionDefault: ProviderEntry = {
  id: 'noVision',
  name: 'No Vision',
  guidanceUrl: null,
  enabled: true,
  sortOrder: 1,
  models: [
    {
      modelId: 'text-only',
      label: 'Text Only',
      vision: false,
      isVisionDefault: false,
      sortOrder: 1,
    },
  ],
};

describe('resolveVisionModelForPlacement', () => {
  // @s13 — a vision-capable selected model is used directly for placement.
  it('returns the selected model when it is vision-capable', () => {
    expect(resolveVisionModelForPlacement(withVisionDefault, 'vision-model')).toBe('vision-model');
  });

  // @s14 — a text-only selected model falls back to the entry's vision-default model.
  it('returns the entry vision-default model when the selected model is not vision-capable', () => {
    expect(resolveVisionModelForPlacement(withVisionDefault, 'text-only')).toBe('vision-model');
  });

  // @s15 — no vision-default model on the entry degrades to text-only (null).
  it('returns null when the selected model is not vision-capable and the entry has no vision default', () => {
    expect(resolveVisionModelForPlacement(withoutVisionDefault, 'text-only')).toBeNull();
  });

  // @s15 — no entry at all (unknown provider) also degrades to text-only.
  it('returns null when there is no entry', () => {
    expect(resolveVisionModelForPlacement(null, 'text-only')).toBeNull();
  });
});
