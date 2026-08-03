import { Button, Card } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import type { ReactNode, RefObject } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useActivityResultPanelAnimations } from './use-activity-result-panel.animations';

export type ActivityResultPanelNodeProps = {
  renderMode: 'hidden' | 'submit' | 'result';
  hasResult: boolean;
  /** Stable ref so the pinned button always reads the latest handler (never stale). */
  onSubmitRef: RefObject<() => void>;
  children?: ReactNode;
  submitTestID?: string;
  resultTestID?: string;
};

/**
 * The rendered footer (submit button or result). Owns the entrance animation so
 * it starts while the Animated.View is actually mounted — the slide-up can't be
 * clipped by a footer that mounts one commit late. The results panel collapses
 * to just its toggle arrow. The shared Next button lives in the footer host.
 *
 * Rendered by the ActivityScrollViewProvider as the stable pinned footer; the
 * ActivityResultPanel feeds it data (mode/result props) through provider state,
 * so the node never remounts on parent re-renders.
 */
export const ActivityResultPanelNode = ({
  renderMode,
  hasResult,
  onSubmitRef,
  children,
  submitTestID,
  resultTestID,
}: ActivityResultPanelNodeProps) => {
  const { t } = useLocalization();
  const { width } = useWindowDimensions();
  const { animatedStyle } = useActivityResultPanelAnimations(renderMode);

  if (renderMode === 'hidden') return null;

  if (hasResult) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.resultStack}>
          <Card testID={resultTestID}>{children}</Card>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View collapsable={false}>
        <Button
          testID={submitTestID}
          fullWidth
          style={styles.submitButton(width)}
          onPress={() => onSubmitRef.current()}
        >
          {t('activity.result.submit')}
        </Button>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme) => ({
  resultStack: {
    position: 'relative',
    marginTop: Platform.OS === 'web' ? theme.spacing.s3 : theme.spacing.s1,
  },
  submitButton: (width: number) => ({
    width: Platform.OS === 'web' ? width * 0.8 : undefined,
    maxWidth: Platform.OS === 'web' ? theme.layout.contentReading : undefined,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : undefined,
    marginTop: Platform.OS === 'web' ? theme.spacing.s3 : theme.spacing.s1,
  }),
}));
