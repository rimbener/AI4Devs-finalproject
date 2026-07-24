jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelError } from './lesson-generation-panel-error';

const mockUseLocalization = useLocalization as jest.Mock;

describe('LessonGenerationPanelError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders the error banner with alert role and recovery action', async () => {
    const onErrorAction = jest.fn();
    const value: LessonGenerationPanelValue = {
      state: 'error',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      errorMessage: 'Generation timed out. Try again.',
      errorActionLabel: 'generation.error.action.retry',
      onErrorAction,
    };

    await render(
      <LessonGenerationPanelProvider value={value}>
        <LessonGenerationPanelError />
      </LessonGenerationPanelProvider>,
    );

    const errorText = screen.getByText('Generation timed out. Try again.');
    expect(errorText.parent?.props.accessibilityRole).toBe('alert');
    fireEvent.press(screen.getByRole('button', { name: 'generation.error.action.retry' }));
    expect(onErrorAction).toHaveBeenCalledTimes(1);
  });

  it('omits the recovery button when errorActionLabel is missing', async () => {
    const value: LessonGenerationPanelValue = {
      state: 'error',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      errorMessage: 'Not ready',
    };

    await render(
      <LessonGenerationPanelProvider value={value}>
        <LessonGenerationPanelError />
      </LessonGenerationPanelProvider>,
    );

    expect(screen.queryByRole('button', { name: /error\.action/ })).toBeNull();
  });
});
