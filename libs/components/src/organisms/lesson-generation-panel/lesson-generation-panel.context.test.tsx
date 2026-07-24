jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { render, renderHook, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  LessonGenerationPanelProvider,
  useLessonGenerationPanel,
} from './lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from './lesson-generation-panel.types';

const mockUseLocalization = useLocalization as jest.Mock;

const baseValue: LessonGenerationPanelValue = {
  state: 'empty',
  composition: 'both',
  onCompositionChange: jest.fn(),
  canGenerate: true,
  onGenerate: jest.fn(),
};

describe('useLessonGenerationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('throws when used outside LessonGenerationPanelProvider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(renderHook(() => useLessonGenerationPanel())).rejects.toThrow(
        'useLessonGenerationPanel must be used within LessonGenerationPanelProvider',
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('returns the provider value to consumers', async () => {
    const Consumer = () => {
      const { state, canGenerate } = useLessonGenerationPanel();
      return (
        <>
          <Text>{state}</Text>
          <Text>{canGenerate ? 'can' : 'cannot'}</Text>
        </>
      );
    };

    await render(
      <LessonGenerationPanelProvider value={baseValue}>
        <Consumer />
      </LessonGenerationPanelProvider>,
    );

    expect(screen.getByText('empty')).toBeTruthy();
    expect(screen.getByText('can')).toBeTruthy();
  });
});
