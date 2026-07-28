import { useLocalization } from '@helsoft/localization';
import { RadioGroupSection } from '../../../molecules/radio-group-section/radio-group-section';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';

type ProviderSelectorProps = {
  disabled: boolean;
};

export const ProviderSelector = ({ disabled }: ProviderSelectorProps) => {
  const { t } = useLocalization();
  const { savedProviders = [], selectedProvider, onProviderChange } = useLessonGenerationPanel();

  if (savedProviders.length === 0) return null;

  return (
    <RadioGroupSection
      title={t('generation.provider.heading')}
      options={savedProviders.map((provider) => ({
        value: provider.id,
        label: provider.name,
      }))}
      value={selectedProvider ?? savedProviders[0]?.id}
      onChange={onProviderChange}
      disabled={disabled}
    />
  );
};
