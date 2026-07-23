import type { GenerationPreference } from './generation-preference.types';

describe('GenerationPreference type', () => {
  // Slice-3 review F1 — public contract lives in co-located *.types.ts, not the service file.
  it('accepts a provider and model pair', () => {
    const preference: GenerationPreference = {
      provider: 'openai',
      model: 'gpt-5.6-luna',
    };

    expect(preference).toEqual({ provider: 'openai', model: 'gpt-5.6-luna' });
  });
});
