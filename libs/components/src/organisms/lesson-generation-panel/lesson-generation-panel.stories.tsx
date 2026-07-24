import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { LessonGenerationPanel } from './lesson-generation-panel';
import { LessonGenerationPanelProvider } from './lesson-generation-panel.context';
import type { LessonGenerationPanelValue } from './lesson-generation-panel.types';

const defaultValue: LessonGenerationPanelValue = {
  state: 'empty',
  composition: 'both',
  onCompositionChange: () => {},
  canGenerate: false,
  onGenerate: () => {},
};

const meta = {
  title: 'Organisms/LessonGenerationPanel',
  component: LessonGenerationPanel,
  render: (args) => (
    <LessonGenerationPanelProvider
      value={{ ...defaultValue, ...(args as LessonGenerationPanelValue) }}
    >
      <LessonGenerationPanel />
    </LessonGenerationPanelProvider>
  ),
  args: defaultValue,
} satisfies Meta<LessonGenerationPanelValue>;

export default meta;

type Story = StoryObj<typeof meta>;

// Empty, Generate unavailable (@s1/@s16) — no extracted document yet.
export const EmptyGenerateDisabled: Story = {
  args: { state: 'empty', canGenerate: false },
};

// Empty, Generate available (@s16) — an extracted document is present.
export const EmptyGenerateEnabled: Story = {
  args: { state: 'empty', canGenerate: true },
};

// Loading (@s14) — the multi-step progress mid-flight; picker + Generate disabled.
export const Loading: Story = {
  args: { state: 'loading', canGenerate: true, currentStep: 'generating' },
};

// Content (@s17) — a ready summary + primary CTA to open the lesson in the player.
export const Content: Story = {
  args: { state: 'content', canGenerate: true, slideCount: 8, onOpenInPlayer: () => {} },
};

// Error, retryable (@s15, task-13) — a readable message + a labeled recovery action button.
export const ErrorRetryable: Story = {
  args: {
    state: 'error',
    canGenerate: true,
    errorMessage: 'Generation timed out. Try again.',
    errorActionLabel: 'Try again',
    onErrorAction: () => {},
  },
};

// Error, no actionable affordance here (@s15, task-13) — e.g. document_not_ready: the actual
// re-upload control is the sibling PdfUpload panel, already visible on the same screen.
export const ErrorNoAction: Story = {
  args: {
    state: 'error',
    canGenerate: false,
    errorMessage: "This document isn't ready yet. Please re-upload it.",
  },
};

// Free-BYOK with provider/model pickers (@s10).
export const FreeByokWithPickers: Story = {
  args: {
    state: 'empty',
    canGenerate: true,
    showPickers: true,
    savedProviders: ['groq', 'openai'],
    modelOptions: [
      { id: 'openai/gpt-oss-20b', labelKey: 'aiModel.groq.gptOss20b' },
      { id: 'openai/gpt-oss-120b', labelKey: 'aiModel.groq.gptOss120b' },
    ],
    selectedProvider: 'groq',
    selectedModel: 'openai/gpt-oss-20b',
    onProviderChange: () => {},
    onModelChange: () => {},
  },
};

// Paid/platform — no pickers (@s19).
export const PlatformNoPickers: Story = {
  args: { state: 'empty', canGenerate: true, showPickers: false },
};

// Free-BYOK, no saved keys — missing-key gate (@s16).
export const FreeByokMissingKey: Story = {
  args: {
    state: 'missing-key',
    canGenerate: false,
    showPickers: false,
    savedProviders: [],
    onMissingKeyAction: () => {},
  },
};

/** Interactive demo purely so the Playwright e2e can exercise choosing a composition, not just
 * assert each state's static markup like the stories above. */
const InteractivePickerDemo = () => {
  const [composition, setComposition] = useState<'instructional-only' | 'activity-only' | 'both'>(
    'both',
  );

  return (
    <LessonGenerationPanelProvider
      value={{
        state: 'empty',
        composition,
        onCompositionChange: (value) => setComposition(value as typeof composition),
        canGenerate: true,
        onGenerate: () => {},
      }}
    >
      <LessonGenerationPanel />
    </LessonGenerationPanelProvider>
  );
};

export const InteractivePicker: Story = {
  args: { state: 'empty', canGenerate: true },
  render: () => <InteractivePickerDemo />,
};
