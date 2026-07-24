import { useLocalization } from '@helsoft/localization';
import { RadioGroupSection } from '../../../molecules/radio-group-section/radio-group-section';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';
import { COMPOSITION_OPTION_VALUES } from '../lesson-generation-panel.helpers';
import { COMPOSITION_LABEL_KEYS } from '../lesson-generation-panel.types';

type CompositionSelectorProps = {
  disabled: boolean;
};

export const CompositionSelector = ({ disabled }: CompositionSelectorProps) => {
  const { composition, onCompositionChange } = useLessonGenerationPanel();
  const { t } = useLocalization();

  return (
    <RadioGroupSection
      title={t('generation.composition.heading')}
      options={COMPOSITION_OPTION_VALUES.map((value) => ({
        value,
        label: t(COMPOSITION_LABEL_KEYS[value]),
      }))}
      value={composition}
      onChange={onCompositionChange}
      disabled={disabled}
    />
  );
};
