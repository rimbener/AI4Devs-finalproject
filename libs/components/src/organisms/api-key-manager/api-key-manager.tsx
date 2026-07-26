import { useLocalization } from '@helsoft/localization';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../atoms/button/button';
import { ApiKeySavedList } from '../../molecules/api-key-saved-list/api-key-saved-list';
import { ApiKeyFormDialog } from '../api-key-form-dialog/api-key-form-dialog';
import type { ApiKeyManagerProps } from './api-key-manager.types';
import { ApiKeyManagerEmpty } from './api-key-manager-empty';
import { ApiKeyManagerError } from './api-key-manager-error';
import { ApiKeyManagerLoading } from './api-key-manager-loading';
import { ApiKeyManagerRemove } from './api-key-manager-remove';
import { useApiKeyManager } from './use-api-key-manager';

/**
 * ApiKeyManager — presentational organism for multi-provider BYOK management.
 * Empty: message + Add button only. List: masked rows + Add (if not all saved).
 * Add/Replace open a modal (provider pick for add; fixed provider for replace).
 */
export const ApiKeyManager = ({
  savedKeys,
  providers,
  isLoading = false,
  isSubmitting = false,
  errorMessage,
  onSave,
  onRemove,
  guidanceUrls,
  getSavedStatusLabel,
  providerNames,
}: ApiKeyManagerProps) => {
  const { t } = useLocalization();
  const {
    modalOpen,
    formMode,
    formProvider,
    selectProvider,
    apiKey,
    setApiKey,
    dialogIsSubmitting,
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
  } = useApiKeyManager({ savedKeys, providers, isSubmitting, hasError: Boolean(errorMessage) });

  const handleSave = () => {
    if (formProvider) {
      onSave(formProvider, apiKey);
    }
  };

  if (isLoading) {
    return <ApiKeyManagerLoading />;
  }

  const addButton = !allSaved ? (
    <Button onPress={openAddModal}>{t('settings.apiKey.manager.addNew')}</Button>
  ) : null;

  return (
    <View style={styles.container}>
      {errorMessage ? <ApiKeyManagerError errorMessage={errorMessage} /> : null}

      {isEmpty ? (
        <ApiKeyManagerEmpty>{addButton}</ApiKeyManagerEmpty>
      ) : (
        <ApiKeySavedList
          savedKeys={savedKeys}
          providers={providers}
          savedProviders={savedProviders}
          getSavedStatusLabel={getSavedStatusLabel}
          providerNames={providerNames}
          isSubmitting={isSubmitting}
          onReplace={openReplaceModal}
          onRemove={setConfirmingRemove}
        >
          {addButton}
        </ApiKeySavedList>
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
        isSubmitting={dialogIsSubmitting}
        isSaveDisabled={isSaveDisabled}
        onSave={handleSave}
        guidanceUrls={guidanceUrls}
        providerNames={providerNames}
      />

      <ApiKeyManagerRemove
        confirmingRemove={confirmingRemove}
        isSubmitting={dialogIsSubmitting}
        setConfirmingRemove={setConfirmingRemove}
        onRemove={onRemove}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.s4,
  },
}));
