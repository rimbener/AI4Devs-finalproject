jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { ModelSelector } from './model-selector';

const mockUseLocalization = useLocalization as jest.Mock;

const modelOptions = [
  { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B' },
  { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B' },
];

const baseValue = (
  overrides: Partial<LessonGenerationPanelValue> = {},
): LessonGenerationPanelValue => ({
  state: 'empty',
  composition: 'both',
  onCompositionChange: jest.fn(),
  canGenerate: true,
  onGenerate: jest.fn(),
  modelOptions,
  selectedModel: 'openai/gpt-oss-20b',
  onModelChange: jest.fn(),
  ...overrides,
});

const renderSelector = (value: LessonGenerationPanelValue, disabled = false) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <ModelSelector disabled={disabled} />
    </LessonGenerationPanelProvider>,
  );

describe('ModelSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders nothing when modelOptions is empty', async () => {
    await renderSelector(baseValue({ modelOptions: [] }));

    expect(screen.queryByText('generation.model.heading')).toBeNull();
  });

  // Proves the `modelOptions = []` destructure default actually matters: without it,
  // `.length` on `undefined` would throw instead of rendering nothing.
  it('renders nothing (without throwing) when modelOptions is undefined', async () => {
    await renderSelector(baseValue({ modelOptions: undefined }));

    expect(screen.queryByText('generation.model.heading')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('renders models and marks the selected one', async () => {
    await renderSelector(baseValue());

    expect(screen.getByText('generation.model.heading')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'GPT OSS 20B', checked: true })).toBeTruthy();
  });

  // `value={selectedModel ?? modelOptions[0]?.id ?? ''}` — proves the fallback resolves to
  // modelOptions[0].id specifically: exactly one radio checked, and it's the first option, never
  // undefined/empty (which would leave every radio unchecked).
  it('defaults to the first model when selectedModel is unset', async () => {
    await renderSelector(baseValue({ selectedModel: undefined }));

    expect(screen.getByRole('radio', { name: 'GPT OSS 20B', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'GPT OSS 120B', checked: false })).toBeTruthy();
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  // `modelOptions[0]?.id ?? ''` — proves both the optional chaining and the '' fallback
  // literal matter. A genuinely sparse `modelOptions` (hole at index 0 — malformed/defensive
  // case; a dense `undefined` element would instead crash unrelated code at line 19's
  // `model.id` inside the `.map`, which isn't what this line's `?.` guards) must not throw,
  // and the resolved value must be the exact empty string (matching an option whose id is
  // ''), not merely "no crash": without `?.` this throws (`undefined.id`); with any fallback
  // literal other than '' this would check no radio instead of the empty-id one.
  it('falls back to the empty string, matching an empty-id option, when modelOptions[0] is a hole', async () => {
    const sparseOptions: Array<{ id: string; label: string }> = new Array(3);
    sparseOptions[1] = { id: '', label: 'Untitled' };
    sparseOptions[2] = { id: 'a', label: 'A' };

    await renderSelector(baseValue({ modelOptions: sparseOptions, selectedModel: undefined }));

    expect(screen.getByRole('radio', { name: 'Untitled', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'A', checked: false })).toBeTruthy();
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  it('calls onModelChange when another model is chosen', async () => {
    const onModelChange = jest.fn();
    await renderSelector(baseValue({ onModelChange }));

    fireEvent.press(screen.getByRole('radio', { name: 'GPT OSS 120B' }));

    expect(onModelChange).toHaveBeenCalledWith('openai/gpt-oss-120b');
  });
});
