import { ACTIVITY_FOOTER_NEXT_TEST_ID } from '@helsoft/activities/test-ids';
import { Button } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ActivityResultPanelNode } from '../molecules/activity-result-panel/activity-result-panel-node';

import type {
  ActivityFooterContextValue,
  ActivityFooterData,
  ActivityScrollViewProviderProps,
} from './activity-scroll-view-provider.types';

const ActivityFooterContext = createContext<ActivityFooterContextValue | null>(null);

/** testID on the footer ScrollView so tests can assert its scroll capability. */
export const ACTIVITY_FOOTER_SCROLL_TEST_ID = 'activity-footer-scroll';

/**
 * Renders a ScrollView (props pass through) with pinned bottom controls: the
 * activity footer (submit/result) and a shared Next button. The Next button is
 * visible by default — so instructional slides get it immediately — and the
 * activity footer hides it until its result is shown. The footer is capped at
 * 45% of the frame and scrolls internally so tall results never clip.
 *
 * The pinned footer is a single stable `ActivityResultPanelNode`; activities
 * register data (mode/result props) through `setFooterData` instead of swapping
 * React elements, so the node never remounts on parent re-renders.
 *
 * `onLayout` measures the wrapper (the stable body frame) rather than the
 * ScrollView, so the reported height doesn't shrink when the footer mounts and
 * split-slide layouts don't jump.
 */
export const ActivityScrollViewProvider = ({
  children,
  onFooterNext,
  onLayout,
  wrapperTestID,
  ...scrollViewProps
}: ActivityScrollViewProviderProps) => {
  const { t } = useLocalization();
  const { width } = useWindowDimensions();
  const [footerData, setFooterData] = useState<ActivityFooterData | null>(null);
  const [nextVisible, setNextVisible] = useState(true);
  const onNextRef = useRef(onFooterNext);
  onNextRef.current = onFooterNext;
  const onSubmitRef = useRef<() => void>(() => {});

  const contextValue = useMemo<ActivityFooterContextValue>(
    () => ({
      setFooterData,
      onSubmitRef,
      setNextVisible,
      onNext: onFooterNext ? () => onNextRef.current?.() : undefined,
    }),
    [onFooterNext],
  );

  return (
    <ActivityFooterContext.Provider value={contextValue}>
      <View style={styles.wrapper} onLayout={onLayout} testID={wrapperTestID}>
        <ScrollView {...scrollViewProps}>{children}</ScrollView>
        {footerData ? (
          <ScrollView
            nestedScrollEnabled
            style={styles.footerScroll}
            testID={ACTIVITY_FOOTER_SCROLL_TEST_ID}
          >
            <ActivityResultPanelNode
              renderMode={footerData.renderMode}
              hasResult={footerData.hasResult}
              onSubmitRef={onSubmitRef}
              submitTestID={footerData.submitTestID}
              resultTestID={footerData.resultTestID}
            >
              {footerData.children}
            </ActivityResultPanelNode>
          </ScrollView>
        ) : null}
        {nextVisible && onFooterNext ? (
          <Button
            testID={ACTIVITY_FOOTER_NEXT_TEST_ID}
            fullWidth
            variant="tonal"
            style={styles.nextButton(width)}
            onPress={() => onNextRef.current?.()}
          >
            {t('player.continue')}
          </Button>
        ) : null}
      </View>
    </ActivityFooterContext.Provider>
  );
};

/** Footer context (data registration, handler ref, Next visibility, forward action), or null outside a provider. */
export const useActivityFooter = (): ActivityFooterContextValue | null =>
  useContext(ActivityFooterContext);

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    flex: 1,
  },
  footerScroll: {
    flexGrow: 0,
    maxHeight: '45%',
  },
  nextButton: (width: number) => ({
    marginTop: theme.spacing.s2,
    width: Platform.OS === 'web' ? width * 0.8 : undefined,
    maxWidth: Platform.OS === 'web' ? theme.layout.contentReading : undefined,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : undefined,
  }),
}));
