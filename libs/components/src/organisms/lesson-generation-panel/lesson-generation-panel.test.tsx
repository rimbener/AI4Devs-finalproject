jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LessonGenerationPanel } from './lesson-generation-panel';
import { LessonGenerationPanelProvider } from './lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from './lesson-generation-panel.types';

const mockUseLocalization = useLocalization as jest.Mock;

const localizationValue = (overrides: Partial<ReturnType<typeof useLocalization>> = {}) => ({
  t: (key: string, options?: Record<string, unknown>) =>
    options ? `${key}:${JSON.stringify(options)}` : key,
  locale: 'en' as const,
  setLocale: jest.fn(),
  supportedLocales: ['en', 'es', 'pt', 'de'] as const,
  ...overrides,
});

const renderPanel = (value: LessonGenerationPanelValue) =>
  render(
    <LessonGenerationPanelProvider value={value}>
      <LessonGenerationPanel />
    </LessonGenerationPanelProvider>,
  );

describe('LessonGenerationPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
  });

  describe('Provider/model pickers (Slice 2)', () => {
    const pickerProps: LessonGenerationPanelValue = {
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      showPickers: true,
      savedProviders: ['groq', 'openai'] as AiProvider[],
      modelOptions: [
        { id: 'openai/gpt-oss-20b', labelKey: 'aiModel.groq.gptOss20b' },
        { id: 'openai/gpt-oss-120b', labelKey: 'aiModel.groq.gptOss120b' },
      ],
      selectedProvider: 'groq',
      selectedModel: 'openai/gpt-oss-20b',
      onProviderChange: jest.fn(),
      onModelChange: jest.fn(),
    };

    // @s10 — saved providers and curated models render above composition.
    it('renders provider and model pickers when showPickers is true', async () => {
      await renderPanel(pickerProps);

      expect(screen.getByText('generation.provider.heading')).toBeTruthy();
      expect(screen.getByText('generation.model.heading')).toBeTruthy();
      expect(
        screen.getByRole('radio', { name: 'settings.apiKey.provider.groq', checked: true }),
      ).toBeTruthy();
    });

    // @s19 — pickers hidden when showPickers is false (platform path).
    it('hides provider and model pickers when showPickers is false', async () => {
      await renderPanel({ ...pickerProps, showPickers: false });

      expect(screen.queryByText('generation.provider.heading')).toBeNull();
      expect(screen.queryByText('generation.model.heading')).toBeNull();
    });

    // @s11 — provider change callback fires with the new provider value.
    it('calls onProviderChange when a different provider is chosen', async () => {
      const onProviderChange = jest.fn();
      await renderPanel({ ...pickerProps, onProviderChange });

      fireEvent.press(screen.getByRole('radio', { name: 'settings.apiKey.provider.openai' }));

      expect(onProviderChange).toHaveBeenCalledWith('openai');
    });

    it('calls onModelChange when a different model is chosen', async () => {
      const onModelChange = jest.fn();
      await renderPanel({ ...pickerProps, onModelChange });

      fireEvent.press(screen.getByRole('radio', { name: 'aiModel.groq.gptOss120b' }));

      expect(onModelChange).toHaveBeenCalledWith('openai/gpt-oss-120b');
    });

    it('requests picker and status copy via the expected i18n keys', async () => {
      const t = jest.fn(localizationValue().t);
      mockUseLocalization.mockReturnValue(localizationValue({ t }));

      await renderPanel({ ...pickerProps, state: 'loading', currentStep: 'generating' });

      expect(t).toHaveBeenCalledWith('generation.provider.heading');
      expect(t).toHaveBeenCalledWith('generation.model.heading');
      expect(t).toHaveBeenCalledWith('generation.step.status.done');
      expect(t).toHaveBeenCalledWith('generation.step.status.upcoming');
    });

    it('hides the model picker when modelOptions is empty', async () => {
      await renderPanel({ ...pickerProps, modelOptions: [] });

      expect(screen.queryByText('generation.model.heading')).toBeNull();
    });

    // @s16 — free-BYOK missing-key gate is its own state (notice only).
    it('shows the missing-key gate when state is missing-key', async () => {
      const onMissingKeyAction = jest.fn();
      await renderPanel({
        ...pickerProps,
        state: 'missing-key',
        showPickers: false,
        savedProviders: [],
        canGenerate: false,
        onMissingKeyAction,
      });

      expect(screen.getByText('upload.apiKeyRequired.message')).toBeTruthy();
      expect(screen.queryByText('generation.provider.heading')).toBeNull();
      expect(screen.queryByText('generation.composition.heading')).toBeNull();
      fireEvent.press(screen.getByRole('button', { name: 'upload.apiKeyRequired.action' }));
      expect(onMissingKeyAction).toHaveBeenCalledTimes(1);
    });

    // @s16 — empty saved providers hides pickers even when showPickers is true.
    it('hides pickers when there are no saved providers', async () => {
      await renderPanel({ ...pickerProps, savedProviders: [], showPickers: true });

      expect(screen.queryByText('generation.provider.heading')).toBeNull();
    });
  });

  describe('Empty state', () => {
    // @s1 — the picker offers all three compositions and reflects the selected one.
    it('renders the composition picker with all three options and the selected one', async () => {
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: false,
        onGenerate: jest.fn(),
      });

      expect(
        screen.getByRole('radio', { name: 'generation.composition.instructionalOnly' }),
      ).toBeTruthy();
      expect(
        screen.getByRole('radio', { name: 'generation.composition.activityOnly' }),
      ).toBeTruthy();
      expect(
        screen.getByRole('radio', { name: 'generation.composition.both', checked: true }),
      ).toBeTruthy();
    });

    // @s2 — choosing a different option calls back with the raw RadioGroup value.
    it('calls onCompositionChange when a different option is chosen', async () => {
      const onCompositionChange = jest.fn();
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange,
        canGenerate: false,
        onGenerate: jest.fn(),
      });

      fireEvent.press(
        screen.getByRole('radio', { name: 'generation.composition.instructionalOnly' }),
      );

      expect(onCompositionChange).toHaveBeenCalledWith('instructional-only');
    });

    // @s16 — Generate is disabled until an extracted document is available.
    it('disables Generate when canGenerate is false', async () => {
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: false,
        onGenerate: jest.fn(),
      });

      expect(
        screen.getByRole('button', { name: 'generation.generate', disabled: true }),
      ).toBeTruthy();
    });

    it('enables Generate and calls onGenerate once an extracted document is available', async () => {
      const onGenerate = jest.fn();
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate,
      });

      const button = screen.getByRole('button', { name: 'generation.generate', disabled: false });
      fireEvent.press(button);

      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    // task-15/@s19 — the picker exposes an accessible group label (WCAG 1.3.1/4.1.2), not just
    // per-option labels, so assistive tech announces what the radio options belong to.
    it('gives the composition picker an accessible group label', async () => {
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: false,
        onGenerate: jest.fn(),
      });

      const group = screen.getByLabelText('generation.composition.heading');
      expect(group.props.accessibilityRole).toBe('radiogroup');
    });

    it('shows no progress and no error in the Empty state', async () => {
      await renderPanel({
        state: 'empty',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: false,
        onGenerate: jest.fn(),
      });

      expect(screen.queryByText('generation.step.reading')).toBeNull();
    });
  });

  describe('Loading state', () => {
    // @s14 — shows the multi-step progress with the current step; picker + Generate disabled.
    it('shows the progress steps and disables the picker and Generate', async () => {
      await renderPanel({
        state: 'loading',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        currentStep: 'generating',
      });

      expect(screen.getByText('generation.step.reading')).toBeTruthy();
      expect(screen.getAllByText('generation.step.generating').length).toBeGreaterThan(0);
      expect(screen.getByText('generation.step.attaching')).toBeTruthy();
      expect(
        screen.getByLabelText('generation.step.generating, generation.step.status.current'),
      ).toBeTruthy();
      expect(
        screen.getByRole('radio', { name: 'generation.composition.both', disabled: true }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'generation.generate', disabled: true }),
      ).toBeTruthy();
    });
  });

  describe('Content state', () => {
    // @s17 — a ready summary (slide count + composition) and a CTA to open the player.
    it('shows the ready summary and calls onOpenInPlayer when the CTA is pressed', async () => {
      const onOpenInPlayer = jest.fn();
      await renderPanel({
        state: 'content',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        slideCount: 6,
        onOpenInPlayer,
      });

      expect(screen.getByText('generation.ready.slideCount:{"count":6}')).toBeTruthy();
      fireEvent.press(screen.getByRole('button', { name: 'generation.ready.openInPlayer' }));

      expect(onOpenInPlayer).toHaveBeenCalledTimes(1);
    });

    // @s17 — the ready summary also names the chosen composition, per spec.md's UI-states table
    // ("Deck-ready summary (slide count + composition)").
    it('shows the chosen composition alongside the slide count', async () => {
      await renderPanel({
        state: 'content',
        composition: 'instructional-only',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        slideCount: 4,
        onOpenInPlayer: jest.fn(),
      });

      expect(
        screen.getByText(
          'generation.ready.composition:{"composition":"generation.composition.instructionalOnly"}',
        ),
      ).toBeTruthy();
    });
  });

  // task-13, @s15 — the Error state: readable message + the recovery affordance the wiring
  // layer decided for the current GenerationErrorCode; panel returns to a usable state.
  describe('Error state', () => {
    it('renders the error message with an alert role and assertive live region', async () => {
      await renderPanel({
        state: 'error',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        errorMessage: 'Generation timed out. Try again.',
      });

      const errorText = screen.getByText('Generation timed out. Try again.');
      expect(errorText.parent?.props.accessibilityRole).toBe('alert');
      expect(errorText.props.accessibilityLiveRegion).toBe('assertive');
    });

    it('shows the recovery action button and calls onErrorAction when pressed', async () => {
      const onErrorAction = jest.fn();
      await renderPanel({
        state: 'error',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        errorMessage: 'Generation timed out. Try again.',
        errorActionLabel: 'generation.error.action.retry',
        onErrorAction,
      });

      fireEvent.press(screen.getByRole('button', { name: 'generation.error.action.retry' }));

      expect(onErrorAction).toHaveBeenCalledTimes(1);
    });

    it('shows no recovery action button when errorActionLabel is omitted', async () => {
      await renderPanel({
        state: 'error',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        errorMessage: "This document isn't ready yet. Please re-upload it.",
      });

      expect(screen.queryByRole('button', { name: /error\.action/ })).toBeNull();
    });

    it('keeps the picker and Generate enabled in the Error state', async () => {
      await renderPanel({
        state: 'error',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        errorMessage: 'Network error',
      });

      expect(
        screen.getByRole('radio', { name: 'generation.composition.both', disabled: false }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'generation.generate', disabled: false }),
      ).toBeTruthy();
    });

    it('shows no progress steps and no content summary in the Error state', async () => {
      await renderPanel({
        state: 'error',
        composition: 'both',
        onCompositionChange: jest.fn(),
        canGenerate: true,
        onGenerate: jest.fn(),
        errorMessage: 'Network error',
      });

      expect(screen.queryByText('generation.step.reading')).toBeNull();
      expect(screen.queryByText('generation.ready.openInPlayer')).toBeNull();
    });
  });

  it('defaults to hiding pickers and the missing-key gate', async () => {
    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
    });

    expect(screen.queryByText('generation.provider.heading')).toBeNull();
    expect(screen.queryByText('upload.apiKeyRequired.message')).toBeNull();
  });

  it('does not show the missing-key gate without an action handler', async () => {
    await renderPanel({
      state: 'missing-key',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
    });

    expect(screen.queryByText('upload.apiKeyRequired.message')).toBeNull();
  });

  it('does not render the error banner outside the error state', async () => {
    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
      errorMessage: 'should not show',
    });

    expect(screen.queryByText('should not show')).toBeNull();
  });

  it('defaults the model picker value to the first option when selectedModel is unset', async () => {
    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      showPickers: true,
      savedProviders: ['groq'],
      modelOptions: [{ id: 'openai/gpt-oss-20b', labelKey: 'aiModel.groq.gptOss20b' }],
      selectedProvider: 'groq',
    });

    expect(
      screen.getByRole('radio', { name: 'aiModel.groq.gptOss20b', checked: true }),
    ).toBeTruthy();
  });

  it('defaults the provider picker to the first saved provider when selectedProvider is unset', async () => {
    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: true,
      onGenerate: jest.fn(),
      showPickers: true,
      savedProviders: ['groq', 'openai'],
      modelOptions: [{ id: 'openai/gpt-oss-20b', labelKey: 'aiModel.groq.gptOss20b' }],
    });

    expect(
      screen.getByRole('radio', { name: 'settings.apiKey.provider.groq', checked: true }),
    ).toBeTruthy();
  });

  it('does not render stray default savedProviders when showPickers is omitted', async () => {
    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
    });

    expect(screen.queryByRole('radio', { name: 'settings.apiKey.provider.groq' })).toBeNull();
  });

  it('requests composition heading via the generation.composition.heading i18n key', async () => {
    const t = jest.fn(localizationValue().t);
    mockUseLocalization.mockReturnValue(localizationValue({ t }));

    await renderPanel({
      state: 'empty',
      composition: 'both',
      onCompositionChange: jest.fn(),
      canGenerate: false,
      onGenerate: jest.fn(),
    });

    expect(t).toHaveBeenCalledWith('generation.composition.heading');
  });
});
