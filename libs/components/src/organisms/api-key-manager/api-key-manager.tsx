import { useLocalization } from '@helsoft/localization';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../atoms/button/button';
import { ProgressIndicator } from '../../atoms/progress-indicator/progress-indicator';
import { ApiKeySavedList } from '../../molecules/api-key-saved-list/api-key-saved-list';
import { ApiKeyFormDialog } from '../api-key-form-dialog/api-key-form-dialog';
import { Dialog } from '../dialog/dialog';
import type { ApiKeyManagerProps } from './api-key-manager.types';
import { useApiKeyManager } from './use-api-key-manager';

/**
 * ApiKeyManager — presentational organism for multi-provider BYOK management.
 * Empty: message + Add button only. List: masked rows + Add (if not all saved).
 * Add/Replace open a modal (provider pick for add; fixed provider for replace).
 */
export const ApiKeyManager = ({
  savedKeys,
  isLoading = false,
  isSubmitting = false,
  errorMessage,
  onSave,
  onRemove,
  guidanceUrls,
  getSavedStatusLabel,
  providerNameKeys,
}: ApiKeyManagerProps) => {
  const { t } = useLocalization();
  const {
    modalOpen,
    formMode,
    formProvider,
    selectProvider,
    apiKey,
    setApiKey,
    confirmingRemove,
    setConfirmingRemove,
    savedProviders,
    unsavedProviders,
    allSaved,
    isEmpty,
    isSaveDisabled,
    openAddModal,
    openReplaceModal,
    closeModal,
  } = useApiKeyManager({ savedKeys, isSubmitting });

  const wasSubmitting = useRef(false);
  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting && !errorMessage && modalOpen) {
      closeModal();
    }
    wasSubmitting.current = isSubmitting;
  }, [isSubmitting, errorMessage, modalOpen, closeModal]);

  const handleSave = () => {
    if (formProvider) {
      onSave(formProvider, apiKey);
    }
  };

  if (isLoading) {
    return (
      <View>
        <ProgressIndicator variant="circular" />
        <Text accessibilityLiveRegion="polite" style={styles.visuallyHidden}>
          {t('settings.apiKey.loadingStatus')} he
        </Text>
      </View>
    );
  }

  const addButton = !allSaved ? (
    <Button onPress={openAddModal}>{t('settings.apiKey.manager.addNew')}</Button>
  ) : null;

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorBannerText} accessibilityLiveRegion="assertive">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyMessage}>{t('settings.apiKey.manager.emptyMessage')}</Text>
          {addButton}
        </View>
      ) : (
        <>
          <ApiKeySavedList
            savedKeys={savedKeys}
            savedProviders={savedProviders}
            getSavedStatusLabel={getSavedStatusLabel}
            providerNameKeys={providerNameKeys}
            isSubmitting={isSubmitting}
            onReplace={openReplaceModal}
            onRemove={setConfirmingRemove}
          />
          {addButton}
        </>
      )}

      <ApiKeyFormDialog
        open={modalOpen}
        onClose={closeModal}
        formMode={formMode}
        formProvider={formProvider}
        unsavedProviders={unsavedProviders}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onSelectProvider={selectProvider}
        isSubmitting={isSubmitting}
        isSaveDisabled={isSaveDisabled}
        onSave={handleSave}
        guidanceUrls={guidanceUrls}
        providerNameKeys={providerNameKeys}
      />

      <Dialog
        open={confirmingRemove !== null}
        onClose={() => setConfirmingRemove(null)}
        headline={t('settings.apiKey.removeConfirmHeadline')}
        confirmLabel={t('settings.apiKey.removeConfirmAction')}
        cancelLabel={t('settings.apiKey.removeConfirmCancelAction')}
        onConfirm={() => {
          const p = confirmingRemove;
          setConfirmingRemove(null);
          if (p) onRemove(p);
        }}
      >
        {t('settings.apiKey.removeConfirmBody')}
      </Dialog>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.s4,
  },
  empty: {
    gap: theme.spacing.s4,
  },
  emptyMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.shape.card,
    padding: theme.spacing.s3,
  },
  errorBannerText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onErrorContainer,
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
}));
