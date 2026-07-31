import { useLocalization } from '@helsoft/localization';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { SlideProgressProps } from './slide-progress.types';

/**
 * SlideProgress — segmented lesson tracker; the signature blue/rust motif.
 * One segment per slide: blue = instructional, rust = activity; filled up to `current`.
 */
export const SlideProgress = ({ slides = [], current = 0, onSeek, style }: SlideProgressProps) => {
  const { t } = useLocalization();

  return (
    <View style={[styles.track, style]}>
      {slides.map((slide, i) => {
        const done = i < current;
        const active = i === current;
        const isActivity = slide.type === 'activity';
        return (
          <Pressable
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are purely positional — the index IS the identity
            key={i}
            accessibilityRole="button"
            accessibilityLabel={t(
              isActivity ? 'player.progress.activity' : 'player.progress.lesson',
              {
                n: i + 1,
              },
            )}
            disabled={!onSeek}
            onPress={() => onSeek?.(i)}
            style={styles.segment}
          >
            {active ? <View pointerEvents="none" style={styles.activeRing(isActivity)} /> : null}
            <View style={styles.fill(isActivity, done, active)} />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
    alignSelf: 'stretch',
  },
  segment: {
    flex: 1,
    minWidth: theme.spacing.s2,
    height: theme.spacing.s1,
  },
  activeRing: (isActivity: boolean) => ({
    position: 'absolute',
    top: -theme.spacing.s1,
    bottom: -theme.spacing.s1,
    left: -theme.spacing.s1,
    right: -theme.spacing.s1,
    borderWidth: 2,
    borderColor: theme.utils.hexWithOpacity(
      isActivity ? theme.colors.tertiary : theme.colors.primary,
      0.4,
    ),
    borderRadius: theme.shape.full,
  }),
  fill: (isActivity: boolean, done: boolean, active: boolean) => ({
    flex: 1,
    borderRadius: theme.shape.full,
    backgroundColor:
      done || active
        ? isActivity
          ? theme.colors.tertiary
          : theme.colors.primary
        : theme.colors.surfaceContainerHighest,
    opacity: done && !active ? 0.85 : 1,
  }),
}));
