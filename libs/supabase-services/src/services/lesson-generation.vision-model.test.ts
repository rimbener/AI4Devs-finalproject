import {
  resolveVisionModelForPlacement,
  resolveVisionModelFromRegistry,
} from '../../../../supabase/functions/generate-lesson/_shared/lesson-generation.vision-model';

describe('resolveVisionModelFromRegistry', () => {
  const registry = {
    groq: {
      models: [
        { id: 'text-only', labelKey: 'x', vision: false },
        { id: 'vision-model', labelKey: 'y', vision: true },
      ],
      visionDefault: 'vision-model',
    },
    noVision: {
      models: [{ id: 'text-only', labelKey: 'z', vision: false }],
      visionDefault: null,
    },
  };

  // @s13 — selected vision-capable model is used for placement.
  it('returns the selected model when it is vision-capable', () => {
    expect(resolveVisionModelFromRegistry(registry, 'groq', 'vision-model')).toBe('vision-model');
  });

  // @s14 — non-vision selected model falls back to the provider vision default.
  it('returns visionDefault when the selected model is not vision-capable', () => {
    expect(resolveVisionModelFromRegistry(registry, 'groq', 'text-only')).toBe('vision-model');
  });

  // @s15 — null visionDefault skips the vision call (degrade to text-only).
  it('returns null when the selected model is not vision-capable and visionDefault is null', () => {
    expect(resolveVisionModelFromRegistry(registry, 'groq' as never, 'text-only')).toBe(
      'vision-model',
    );
    expect(
      resolveVisionModelFromRegistry(
        { noVision: registry.noVision },
        'noVision' as never,
        'text-only',
      ),
    ).toBeNull();
  });
});

describe('resolveVisionModelForPlacement', () => {
  // @s14 — groq text model falls back to the curated vision default.
  it('falls back to groq visionDefault for a non-vision text model', () => {
    expect(resolveVisionModelForPlacement('groq', 'openai/gpt-oss-20b')).toBe('qwen/qwen3.6-27b');
  });

  // @s13 — openai vision model is used directly.
  it('uses a vision-capable selected model directly', () => {
    expect(resolveVisionModelForPlacement('openai', 'gpt-5.6-luna')).toBe('gpt-5.6-luna');
  });
});
