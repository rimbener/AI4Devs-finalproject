import { useLayoutEffect, useRef } from 'react';
import { useActivityFooter } from '../../activity-scroll-view-provider/activity-scroll-view-provider';
import type { ActivityFooterData } from '../../activity-scroll-view-provider/activity-scroll-view-provider.types';
import type { ActivityResultPanelProps } from './activity-result-panel.types';
import { ActivityResultPanelNode } from './activity-result-panel-node';

/**
 * ActivityResultPanel — shared activity footer.
 * The submit button stays hidden until the activity is complete (`canSubmit`),
 * then slides up from the bottom; once `hasResult` flips true the button is
 * replaced by the `children` result. Inside an ActivityScrollViewProvider the footer
 * renders pinned below the ScrollView (always on screen); standalone it renders
 * inline as a fallback. Result mode offers a collapse/expand toggle. The shared
 * Next button is rendered by the footer host and shown once the result exists.
 *
 * The pinned path registers DATA (mode/result props) with the provider, never a
 * React element: the provider owns a single stable `ActivityResultPanelNode`,
 * so re-renders from the parent (new result children, lesson-player state) just
 * update that data — the node never remounts, its entrance animation doesn't
 * replay, and result child state (e.g. collapse) survives.
 */
export const ActivityResultPanel = ({
  canSubmit,
  onSubmit,
  hasResult,
  children,
  submitTestID,
  resultTestID,
}: ActivityResultPanelProps) => {
  const footer = useActivityFooter();
  const setFooterData = footer?.setFooterData ?? null;
  const onSubmitRef = footer?.onSubmitRef ?? null;
  const setNextVisible = footer?.setNextVisible ?? null;
  const renderMode = hasResult ? 'result' : canSubmit ? 'submit' : 'hidden';

  // Keep the latest handler in the provider's ref so the pinned button always acts
  // on fresh state without re-registering (and re-rendering the provider) on every
  // parent re-render (e.g. each keystroke in open-ended).
  const ownOnSubmitRef = useRef(onSubmit);
  ownOnSubmitRef.current = onSubmit;
  if (onSubmitRef) onSubmitRef.current = onSubmit;

  // Register the footer data whenever its content could change — not just on mode
  // transitions — so result children (explanation, collapse state, summary) stay fresh
  // when the parent re-renders while already in result mode. Updating data (not an
  // element) keeps the provider's single host node mounted. The shared Next button
  // shows with the result and hides otherwise; on unmount it reverts to the host
  // default (visible) so instructional slides get it. While hidden, register nothing —
  // a null footer keeps the provider from mounting an empty footer host ScrollView.
  useLayoutEffect(() => {
    if (!setFooterData) return;
    if (renderMode === 'hidden') {
      setFooterData(null);
      setNextVisible?.(false);
      return () => {
        setFooterData(null);
        setNextVisible?.(true);
      };
    }
    const data: ActivityFooterData = {
      renderMode,
      hasResult,
      children,
      submitTestID,
      resultTestID,
    };
    setFooterData(data);
    setNextVisible?.(renderMode === 'result');
    return () => {
      setFooterData(null);
      setNextVisible?.(true);
    };
  }, [renderMode, hasResult, setFooterData, setNextVisible, children, submitTestID, resultTestID]);

  return setFooterData ? null : (
    <ActivityResultPanelNode
      renderMode={renderMode}
      hasResult={hasResult}
      onSubmitRef={ownOnSubmitRef}
      submitTestID={submitTestID}
      resultTestID={resultTestID}
    >
      {children}
    </ActivityResultPanelNode>
  );
};
