import { useLocalization } from '@helsoft/localization';

import { GenerationProgress } from '../../../molecules/generation-progress/generation-progress';
import type { GenerationProgressStepStatus } from '../../../molecules/generation-progress/generation-progress.types';
import { LessonGenerationPanelControls } from '../components/lesson-generation-panel-controls';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';
import { stepToIndex } from '../lesson-generation-panel.helpers';

const STEP_LABEL_KEYS = [
  'generation.step.reading',
  'generation.step.generating',
  'generation.step.attaching',
];

/** review.md round-1 finding #1 — status a11y suffixes come from `t()`, not the molecule. */
const STATUS_LABEL_KEYS: Record<GenerationProgressStepStatus, string> = {
  done: 'generation.step.status.done',
  current: 'generation.step.status.current',
  upcoming: 'generation.step.status.upcoming',
};

export const LessonGenerationPanelLoading = () => {
  const { currentStep } = useLessonGenerationPanel();
  const { t } = useLocalization();

  return (
    <>
      <LessonGenerationPanelControls />
      <GenerationProgress
        steps={STEP_LABEL_KEYS.map((key) => ({ label: t(key) }))}
        currentIndex={stepToIndex(currentStep)}
        statusLabels={{
          done: t(STATUS_LABEL_KEYS.done),
          current: t(STATUS_LABEL_KEYS.current),
          upcoming: t(STATUS_LABEL_KEYS.upcoming),
        }}
      />
    </>
  );
};
