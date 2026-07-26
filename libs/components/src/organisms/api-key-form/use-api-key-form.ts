import { useLocalization } from '@helsoft/localization';
import type { SavedProviderKey } from '@helsoft/types';
import { useEffect, useReducer, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { apiKeyFormReducer, initialApiKeyFormState } from './use-api-key-form.reducer';

type UseApiKeyFormArgs = {
  savedKey: SavedProviderKey | null;
  isLoadingStatus?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
};

/**
 * Local field/replace/confirm state + derived Empty flags + iOS VoiceOver announcements
 * for loading/error/submitting transitions (WCAG 4.1.3).
 */
export const useApiKeyForm = ({
  savedKey,
  isLoadingStatus = false,
  isSubmitting = false,
  errorMessage,
}: UseApiKeyFormArgs) => {
  const { t } = useLocalization();
  const [state, dispatch] = useReducer(apiKeyFormReducer, initialApiKeyFormState);
  const wasSubmitting = useRef(isSubmitting);

  // @s4 — once a replace-save resolves successfully (isSubmitting flips back to false while
  // the savedKey still indicates a saved key), the form reverts to the masked state instead of
  // leaving the input open.
  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting && savedKey !== null) {
      dispatch({ type: 'replace-save/success' });
    }
    wasSubmitting.current = isSubmitting;
  }, [isSubmitting, savedKey]);

  // @s6/@s9 — announces a save/remove failure to assistive tech (iOS VoiceOver parity;
  // Android/Web get the banner's own accessibilityLiveRegion).
  useEffect(() => {
    if (errorMessage) {
      AccessibilityInfo.announceForAccessibility(errorMessage);
    }
  }, [errorMessage]);

  // Full-review Round 1, Major 4 (WCAG 4.1.3) — accessibilityLiveRegion has no effect on iOS
  // VoiceOver, so the status-loading transition also needs this imperative announcement
  // (mirrors LoginForm's isSubmitting effect).
  useEffect(() => {
    if (isLoadingStatus) {
      AccessibilityInfo.announceForAccessibility(t('settings.apiKey.loadingStatus'));
    }
  }, [isLoadingStatus, t]);

  // Same iOS-parity need for the isSubmitting progress label (WCAG 4.1.3).
  useEffect(() => {
    if (isSubmitting) {
      AccessibilityInfo.announceForAccessibility(t('general.saving'));
    }
  }, [isSubmitting, t]);

  const showInput = savedKey === null || state.isReplacing;
  // @s5 — a blank/whitespace-only key is never submittable (AC7).
  const isSaveDisabled = isSubmitting || !state.apiKey.trim();

  return {
    apiKey: state.apiKey,
    setApiKey: (apiKey: string) => dispatch({ type: 'set-api-key', apiKey }),
    isReplacing: state.isReplacing,
    setIsReplacing: (isReplacing: boolean) => {
      if (isReplacing) dispatch({ type: 'start-replace' });
    },
    isConfirmingRemove: state.isConfirmingRemove,
    setIsConfirmingRemove: (isConfirmingRemove: boolean) => {
      dispatch({
        type: isConfirmingRemove ? 'confirm-remove/open' : 'confirm-remove/close',
      });
    },
    showInput,
    isSaveDisabled,
  };
};
