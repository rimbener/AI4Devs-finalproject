jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelLoading } from './lesson-generation-panel-loading';

const mockUseLocalization = useLocalization as jest.Mock;

describe('LessonGenerationPanelLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders controls plus generation progress for the current step', async () => {
    const value: LessonGenerationPanelValue = {
      state: 'loading',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      currentStep: 'generating',
    };

    await render(
      <LessonGenerationPanelProvider value={value}>
        <LessonGenerationPanelLoading />
      </LessonGenerationPanelProvider>,
    );

    expect(screen.getByText('generation.step.reading')).toBeTruthy();
    expect(screen.getAllByText('generation.step.generating').length).toBeGreaterThan(0);
    expect(screen.getByText('generation.step.attaching')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'generation.generate', disabled: true }),
    ).toBeTruthy();
  });
});
