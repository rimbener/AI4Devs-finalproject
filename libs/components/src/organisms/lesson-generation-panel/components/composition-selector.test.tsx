jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { CompositionSelector } from './composition-selector';

const mockUseLocalization = useLocalization as jest.Mock;

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

const renderSelector = (value: LessonGenerationPanelValue, disabled = false) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <CompositionSelector disabled={disabled} />
    </LessonGenerationPanelProvider>,
  );

describe('CompositionSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders all three composition options with the selected value', async () => {
    await renderSelector(baseValue({ composition: 'both' }));

    expect(
      screen.getByRole('radio', { name: 'generation.composition.instructionalOnly' }),
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'generation.composition.activityOnly' })).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: 'generation.composition.both', checked: true }),
    ).toBeTruthy();
  });

  it('calls onCompositionChange with the raw radio value', async () => {
    const onCompositionChange = jest.fn();
    await renderSelector(baseValue({ onCompositionChange }));

    fireEvent.press(
      screen.getByRole('radio', { name: 'generation.composition.instructionalOnly' }),
    );

    expect(onCompositionChange).toHaveBeenCalledWith('instructional-only');
  });

  it('disables options when disabled is true', async () => {
    await renderSelector(baseValue(), true);

    expect(
      screen.getByRole('radio', { name: 'generation.composition.both', disabled: true }),
    ).toBeTruthy();
  });
});
