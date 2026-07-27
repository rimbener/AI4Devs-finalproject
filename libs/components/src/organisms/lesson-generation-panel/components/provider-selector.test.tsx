jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { ProviderSelector } from './provider-selector';

const mockUseLocalization = useLocalization as jest.Mock;

const baseValue = (
  overrides: Partial<LessonGenerationPanelValue> = {},
): LessonGenerationPanelValue => ({
  state: 'empty',
  composition: 'both',
  onCompositionChange: jest.fn(),
  canGenerate: true,
  onGenerate: jest.fn(),
  savedProviders: [
    { id: 'groq', name: 'Groq' },
    { id: 'openai', name: 'OpenAI' },
  ],
  selectedProvider: 'groq',
  onProviderChange: jest.fn(),
  ...overrides,
});

const renderSelector = (value: LessonGenerationPanelValue, disabled = false) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <ProviderSelector disabled={disabled} />
    </LessonGenerationPanelProvider>,
  );

describe('ProviderSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders saved providers and marks the selected one', async () => {
    await renderSelector(baseValue());

    expect(screen.getByRole('radio', { name: 'Groq', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
  });

  // `value={selectedProvider ?? savedProviders[0]?.id}` — proves the fallback resolves to
  // savedProviders[0].id specifically: exactly one radio checked, and it's the first option.
  it('defaults selection to the first saved provider when selectedProvider is unset', async () => {
    await renderSelector(baseValue({ selectedProvider: undefined }));

    expect(screen.getByRole('radio', { name: 'Groq', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'OpenAI', checked: false })).toBeTruthy();
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  // `savedProviders[0]?.id` — proves the `?.` matters for a genuinely sparse savedProviders
  // (hole at index 0 — malformed/defensive case; a dense `undefined` element would instead
  // crash unrelated code at line 19's `provider.id` inside the `.map`, which isn't what this
  // line's `?.` guards). Without `?.` this throws (`undefined.id`); with `?.` it resolves to
  // undefined and renders with nothing checked, instead of crashing.
  it('renders without throwing, with nothing checked, when savedProviders[0] is a hole', async () => {
    const sparseProviders: Array<{ id: 'groq' | 'openai'; name: string }> = new Array(2);
    sparseProviders[1] = { id: 'openai', name: 'OpenAI' };

    await renderSelector(
      baseValue({ savedProviders: sparseProviders, selectedProvider: undefined }),
    );

    expect(screen.getByRole('radio', { name: 'OpenAI', checked: false })).toBeTruthy();
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0);
  });

  it('calls onProviderChange when another provider is chosen', async () => {
    const onProviderChange = jest.fn();
    await renderSelector(baseValue({ onProviderChange }));

    fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));

    expect(onProviderChange).toHaveBeenCalledWith('openai');
  });

  it('renders nothing when there are no saved providers', async () => {
    await renderSelector(baseValue({ savedProviders: [] }));

    expect(screen.queryByText('generation.provider.heading')).toBeNull();
  });

  // Proves the `savedProviders = []` destructure default actually matters: without it,
  // `.length` on `undefined` would throw instead of rendering nothing.
  it('renders nothing (without throwing) when savedProviders is undefined', async () => {
    await renderSelector(baseValue({ savedProviders: undefined }));

    expect(screen.queryByText('generation.provider.heading')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });
});
