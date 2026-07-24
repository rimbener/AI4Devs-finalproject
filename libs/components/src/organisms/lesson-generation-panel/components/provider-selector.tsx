import { useLocalization } from '@helsoft/localization';
import { PROVIDER_NAME_KEYS } from '@helsoft/types';
import { RadioGroupSection } from '../../../molecules/radio-group-section/radio-group-section';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';

type ProviderSelectorProps = {
  disabled: boolean;
};

export const ProviderSelector = ({ disabled }: ProviderSelectorProps) => {
  const { t } = useLocalization();
  const { savedProviders = [], selectedProvider, onProviderChange } = useLessonGenerationPanel();

  if (savedProviders?.length === 0) return null;

  return (
    <RadioGroupSection
      title={t('generation.provider.heading')}
      options={savedProviders.map((provider) => ({
        value: provider,
        label: t(PROVIDER_NAME_KEYS[provider]),
      }))}
      value={selectedProvider ?? savedProviders[0]}
      onChange={onProviderChange}
      disabled={disabled}
    />
  );
};
