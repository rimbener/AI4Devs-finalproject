import { ApiKeyRequiredNotice } from '../../api-key-required-notice/api-key-required-notice';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';

export const LessonGenerationPanelMissingKey = () => {
  const { onMissingKeyAction } = useLessonGenerationPanel();

  if (!onMissingKeyAction) return null;

  return <ApiKeyRequiredNotice onNavigateToAccount={onMissingKeyAction} />;
};
