jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelControls } from './lesson-generation-panel-controls';

const mockUseLocalization = useLocalization as jest.Mock;

const localizationValue = () => ({
  t: (key: string) => key,
  locale: 'en' as const,
  setLocale: jest.fn(),
  supportedLocales: ['en'] as const,
});

const baseValue = (
  overrides: Partial<LessonGenerationPanelValue> = {},
): LessonGenerationPanelValue => ({
  state: 'empty',
  composition: 'both',
  onCompositionChange: jest.fn(),
  canGenerate: true,
  onGenerate: jest.fn(),
  ...overrides,
});

const renderControls = (value: LessonGenerationPanelValue) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <LessonGenerationPanelControls />
    </LessonGenerationPanelProvider>,
  );

describe('LessonGenerationPanelControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  it('renders composition + Generate and hides pickers by default', async () => {
    await renderControls(baseValue());

    expect(screen.getByText('generation.composition.heading')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'generation.generate' })).toBeTruthy();
    expect(screen.queryByText('generation.provider.heading')).toBeNull();
  });

  it('renders provider and model pickers when showPickers and savedProviders are set', async () => {
    await renderControls(
      baseValue({
        showPickers: true,
        savedProviders: [
          { id: 'groq', name: 'Groq' },
          { id: 'openai', name: 'OpenAI' },
        ],
        modelOptions: [{ id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B' }],
        selectedProvider: 'groq',
        selectedModel: 'openai/gpt-oss-20b',
      }),
    );

    expect(screen.getByText('generation.provider.heading')).toBeTruthy();
    expect(screen.getByText('generation.model.heading')).toBeTruthy();
  });

  it('disables Generate when canGenerate is false', async () => {
    await renderControls(baseValue({ canGenerate: false }));

    expect(
      screen.getByRole('button', { name: 'generation.generate', disabled: true }),
    ).toBeTruthy();
  });

  it('disables controls while loading', async () => {
    await renderControls(baseValue({ state: 'loading', canGenerate: true }));

    expect(
      screen.getByRole('radio', { name: 'generation.composition.both', disabled: true }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'generation.generate', disabled: true }),
    ).toBeTruthy();
  });

  it('calls onGenerate when Generate is pressed', async () => {
    const onGenerate = jest.fn();
    await renderControls(baseValue({ onGenerate, canGenerate: true }));

    fireEvent.press(screen.getByRole('button', { name: 'generation.generate', disabled: false }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
