jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
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
  savedProviders: ['groq', 'openai'] as AiProvider[],
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

    expect(
      screen.getByRole('radio', { name: 'settings.apiKey.provider.groq', checked: true }),
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'settings.apiKey.provider.openai' })).toBeTruthy();
  });

  it('defaults selection to the first saved provider when selectedProvider is unset', async () => {
    await renderSelector(baseValue({ selectedProvider: undefined }));

    expect(
      screen.getByRole('radio', { name: 'settings.apiKey.provider.groq', checked: true }),
    ).toBeTruthy();
  });

  it('calls onProviderChange when another provider is chosen', async () => {
    const onProviderChange = jest.fn();
    await renderSelector(baseValue({ onProviderChange }));

    fireEvent.press(screen.getByRole('radio', { name: 'settings.apiKey.provider.openai' }));

    expect(onProviderChange).toHaveBeenCalledWith('openai');
  });

  it('renders nothing when there are no saved providers', async () => {
    await renderSelector(baseValue({ savedProviders: [] }));

    expect(screen.queryByText('generation.provider.heading')).toBeNull();
  });
});
