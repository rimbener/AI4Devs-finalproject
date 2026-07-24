jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LessonGenerationPanelProvider } from '../lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from '../lesson-generation-panel.types';
import { LessonGenerationPanelMissingKey } from './lesson-generation-panel-missing-key';

const mockUseLocalization = useLocalization as jest.Mock;

const baseValue = (
  overrides: Partial<LessonGenerationPanelValue> = {},
): LessonGenerationPanelValue => ({
  state: 'missing-key',
  composition: 'both',
  onCompositionChange: jest.fn(),
  canGenerate: false,
  onGenerate: jest.fn(),
  ...overrides,
});

const renderMissingKey = (value: LessonGenerationPanelValue) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <LessonGenerationPanelMissingKey />
    </LessonGenerationPanelProvider>,
  );

describe('LessonGenerationPanelMissingKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string) => key,
      locale: 'en',
      setLocale: jest.fn(),
      supportedLocales: ['en'],
    });
  });

  it('renders ApiKeyRequiredNotice and fires onMissingKeyAction', async () => {
    const onMissingKeyAction = jest.fn();
    await renderMissingKey(baseValue({ onMissingKeyAction }));

    expect(screen.getByText('upload.apiKeyRequired.message')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'upload.apiKeyRequired.action' }));
    expect(onMissingKeyAction).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when onMissingKeyAction is omitted', async () => {
    await renderMissingKey(baseValue());

    expect(screen.queryByText('upload.apiKeyRequired.message')).toBeNull();
  });
});
