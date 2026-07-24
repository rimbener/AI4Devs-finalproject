jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelEmpty } from './lesson-generation-panel-empty';

const mockUseLocalization = useLocalization as jest.Mock;

describe('LessonGenerationPanelEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders controls without progress, ready summary, or error banner', async () => {
    const value: LessonGenerationPanelValue = {
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
    };

    await render(
      <LessonGenerationPanelProvider value={value}>
        <LessonGenerationPanelEmpty />
      </LessonGenerationPanelProvider>,
    );

    expect(screen.getByText('generation.composition.heading')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'generation.generate', disabled: true }),
    ).toBeTruthy();
    expect(screen.queryByText('generation.step.reading')).toBeNull();
    expect(screen.queryByText('generation.ready.openInPlayer')).toBeNull();
  });
});
