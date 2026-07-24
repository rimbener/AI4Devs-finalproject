import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Card } from '../../atoms/card/card';
import { useLessonGenerationPanel } from './lesson-generation-panel.context';
import type { LessonGenerationPanelState } from './lesson-generation-panel.types';
import { LessonGenerationPanelContent } from './states/lesson-generation-panel-content';
import { LessonGenerationPanelEmpty } from './states/lesson-generation-panel-empty';
import { LessonGenerationPanelError } from './states/lesson-generation-panel-error';
import { LessonGenerationPanelLoading } from './states/lesson-generation-panel-loading';
import { LessonGenerationPanelMissingKey } from './states/lesson-generation-panel-missing-key';

/**
 * LessonGenerationPanel — presentational organism configuring + triggering generation
 * (spec.md UI states table): Empty / Loading / Content / Error / MissingKey.
 * Prop-less — reads `LessonGenerationPanelProvider` mounted by the wiring layer / stories.
 * Owns `generation.*` i18n keys so molecules stay i18n-free.
 */
export const LessonGenerationPanel = () => {
  const { state } = useLessonGenerationPanel();

  return (
    <Card>
      <View style={styles.root}>
        <PanelContent state={state} />
      </View>
    </Card>
  );
};

const PanelContent = ({ state }: { state: LessonGenerationPanelState }) => {
  switch (state) {
    case 'missing-key':
      return <LessonGenerationPanelMissingKey />;
    case 'empty':
      return <LessonGenerationPanelEmpty />;
    case 'loading':
      return <LessonGenerationPanelLoading />;
    case 'content':
      return <LessonGenerationPanelContent />;
    case 'error':
      return <LessonGenerationPanelError />;
  }
};

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing.s4,
  },
}));
