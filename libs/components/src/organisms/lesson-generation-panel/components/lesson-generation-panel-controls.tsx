import { useLocalization } from '@helsoft/localization';
import { Button } from '../../../atoms/button/button';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';
import { CompositionSelector } from './composition-selector';
import { ModelSelector } from './model-selector';
import { ProviderSelector } from './provider-selector';

export const LessonGenerationPanelControls = () => {
  const {
    state,
    showPickers = false,
    savedProviders = [],
    canGenerate,
    onGenerate,
  } = useLessonGenerationPanel();
  const { t } = useLocalization();
  const disabled = state === 'loading';

  return (
    <>
      {showPickers && savedProviders.length > 0 ? (
        <>
          <ProviderSelector disabled={disabled} />
          <ModelSelector disabled={disabled} />
        </>
      ) : null}

      <CompositionSelector disabled={disabled} />

      <Button disabled={disabled || !canGenerate} onPress={onGenerate}>
        {t('generation.generate')}
      </Button>
    </>
  );
};
