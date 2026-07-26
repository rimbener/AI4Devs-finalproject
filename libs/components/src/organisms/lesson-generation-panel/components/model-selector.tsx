import { useLocalization } from '@helsoft/localization';
import { RadioGroupSection } from '../../../molecules/radio-group-section/radio-group-section';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';

type ModelSelectorProps = {
  disabled: boolean;
};

export const ModelSelector = ({ disabled }: ModelSelectorProps) => {
  const { t } = useLocalization();
  const { modelOptions = [], selectedModel, onModelChange } = useLessonGenerationPanel();

  if (modelOptions.length === 0) return null;

  return (
    <RadioGroupSection
      title={t('generation.model.heading')}
      options={modelOptions.map((model) => ({
        value: model.id,
        label: model.label,
      }))}
      value={selectedModel ?? modelOptions[0]?.id ?? ''}
      onChange={onModelChange ?? (() => {})}
      disabled={disabled}
    />
  );
};
