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

  it('calls onModelChange when another model is chosen', async () => {
    const onModelChange = jest.fn();
    await renderSelector(baseValue({ onModelChange }));

    fireEvent.press(screen.getByRole('radio', { name: 'GPT OSS 120B' }));

    expect(onModelChange).toHaveBeenCalledWith('openai/gpt-oss-120b');
  });
});
