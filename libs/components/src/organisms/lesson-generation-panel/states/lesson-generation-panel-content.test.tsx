jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelContent } from './lesson-generation-panel-content';

const mockUseLocalization = useLocalization as jest.Mock;

describe('LessonGenerationPanelContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) =>
        options ? `${key}:${JSON.stringify(options)}` : key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders ready summary and calls onOpenInPlayer', async () => {
    const onOpenInPlayer = jest.fn();
    const value: LessonGenerationPanelValue = {
      state: 'content',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      slideCount: 6,
      onOpenInPlayer,
    };

    await render(
      <LessonGenerationPanelProvider value={value}>
        <LessonGenerationPanelContent />
      </LessonGenerationPanelProvider>,
    );

    expect(screen.getByText('generation.ready.slideCount:{"count":6}')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'generation.ready.openInPlayer' }));
    expect(onOpenInPlayer).toHaveBeenCalledTimes(1);
  });
});
