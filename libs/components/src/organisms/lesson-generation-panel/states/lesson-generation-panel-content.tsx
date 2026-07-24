import { useLocalization } from '@helsoft/localization';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../../atoms/button/button';
import { LessonGenerationPanelControls } from '../components/lesson-generation-panel-controls';
import { useLessonGenerationPanel } from '../lesson-generation-panel.context';
import { COMPOSITION_LABEL_KEYS } from '../lesson-generation-panel.types';

export const LessonGenerationPanelContent = () => {
  const { composition, slideCount = 0, onOpenInPlayer } = useLessonGenerationPanel();
  const { t } = useLocalization();

  return (
    <>
      <LessonGenerationPanelControls />
      <View style={styles.section}>
        <Text style={styles.summary}>
          {t('generation.ready.slideCount', { count: slideCount })}
        </Text>
        <Text style={styles.summary}>
          {t('generation.ready.composition', {
            composition: t(COMPOSITION_LABEL_KEYS[composition]),
          })}
        </Text>
        <Button onPress={onOpenInPlayer}>{t('generation.ready.openInPlayer')}</Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.spacing.s3,
  },
  summary: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
}));
