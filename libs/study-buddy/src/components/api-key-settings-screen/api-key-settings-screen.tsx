import { CardListWithABMDialog, ProgressIndicator } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AddApiKey } from './add-api-key';
import { mapSavedKeysToItems } from './api-key-settings-screen-item';
import { useApiKeyManager } from './hooks/use-api-key-manager';
import { useApiKeySettings } from './hooks/use-api-key-settings';

/**
 * ApiKeySettingsScreen — dedicated API keys screen (title + ApiKeyManager). Render + event
 * wiring only; all derived state and hook composition live in `useApiKeySettings`
 * (`component-split.mdc`). `useApiKeySettings` just keeps its existing loading affordance
 * until both the catalog and the key status settle (@s11) — no new loading UI.
 */
export const ApiKeySettingsScreen = () => {
  const { t } = useLocalization();

  const settings = useApiKeySettings();
  const manager = useApiKeyManager({
    savedKeys: settings.savedKeys,
    enabledProviders: settings.enabledProviderIds,
    isSubmitting: settings.isSubmitting,
    hasError: settings.isError,
  });

  // Stryker disable next-line StringLiteral: the '' fallback (formProvider still null) is
  // provably unreachable while the edit dialog is actually visible — CardListWithABMDialog's own
  // openEditDialog calls this screen's onEditPress (which sets manager.formProvider via
  // openReplaceModal) synchronously in the very same dispatch that flips its internal dialogType
  // to 'edit', so both land in the same React commit. There is no render where dialogType==='edit'
  // and formProvider is still null.
  const providerLabel = manager.formProvider ? settings.providerNames[manager.formProvider] : '';
  // Documented-equivalent mutant (mutation.md): same reasoning as providerLabel above, mirrored
  // for the remove flow — openRemoveModal(provider) always sets confirmingRemove in the same
  // dispatch that opens the remove dialog, so this '' fallback never renders. A `Stryker disable
  // next-line` comment does not suppress this specific mutant (Stryker does not honor the
  // directive on a multi-line ternary's nested alternate branch) — left as a documented survivor
  // instead of forcing an artificial reachability test.
  const removeProviderLabel = manager.confirmingRemove
    ? settings.providerNames[manager.confirmingRemove]
    : '';

  const items = useMemo(
    () =>
      mapSavedKeysToItems(
        settings.savedKeys,
        settings.providerNames,
        settings.getSavedStatusLabel,
        settings.enabledProviderIds,
        t('general.disabled'),
      ),
    [
      settings.savedKeys,
      settings.providerNames,
      settings.getSavedStatusLabel,
      settings.enabledProviderIds,
      t,
    ],
  );

  const renderForm = useCallback(
    () => (
      <AddApiKey
        providerNames={settings.providerNames}
        unsavedProviders={manager.unsavedProviders}
        formProvider={manager.formProvider}
        onSelectProvider={manager.selectProvider}
        apiKey={manager.apiKey}
        onApiKeyChange={manager.setApiKey}
        isSubmitting={settings.isSubmitting}
        formMode={manager.formMode}
        guidanceUrls={settings.guidanceUrls}
      />
    ),
    [
      settings.providerNames,
      manager.unsavedProviders,
      manager.formProvider,
      manager.selectProvider,
      manager.apiKey,
      manager.setApiKey,
      settings.isSubmitting,
      manager.formMode,
      settings.guidanceUrls,
    ],
  );

  const renderRemoveConfirmation = useCallback(
    () => (
      <Text style={styles.removeConfirmationText}>{t('settings.apiKey.removeConfirmBody')}</Text>
    ),
    [t],
  );

  const handleSave = () => {
    // Stryker disable next-line ConditionalExpression: unreachable via the real UI — the Save
    // button's `submitDisabled` (manager.isSaveDisabled) is already true whenever formProvider is
    // null, so handleSave can only ever run with it set. Kept as a defensive guard against
    // `saveApiKey(null, ...)`; still asserted not-called via a disabled-button press (see test
    // "does not call saveApiKey when Save is pressed with no provider selected").
    if (manager.formProvider) {
      settings.saveApiKey(manager.formProvider, manager.apiKey);
    }
  };

  const handleRemove = () => {
    // Stryker disable next-line ConditionalExpression: unreachable via the real UI —
    // openRemoveModal always sets confirmingRemove in the same dispatch that opens the remove
    // dialog (see removeProviderLabel above), so onRemoveConfirm can never fire with it null.
    // Kept as a defensive guard against `removeApiKey(undefined)`.
    if (manager.confirmingRemove) {
      settings.removeApiKey(manager.confirmingRemove);
    }
  };

  const handleClose = () => {
    settings.resetSave();
    settings.resetRemove();
  };

  return (
    <>
      {settings.isLoading ? (
        <View style={styles.progressIndicator}>
          <ProgressIndicator variant="circular" size={60} />
        </View>
      ) : (
        <CardListWithABMDialog
          submitDisabled={
            manager.confirmingRemove ? manager.dialogIsSubmitting : manager.isSaveDisabled
          }
          showAddButton={!manager.allSaved}
          onAddPress={manager.openAddModal}
          onClose={handleClose}
          style={styles.cardList}
          cardStyle={styles.card}
          title={t('settings.apiKey.screenTitle')}
          items={items}
          addButtonLabel={t('settings.apiKey.manager.addNew')}
          emptyStateMessage={t('settings.apiKey.manager.emptyMessage')}
          renderAddForm={renderForm}
          addDialogTitle={t('settings.apiKey.manager.addNew')}
          onAddSubmit={handleSave}
          renderEditForm={renderForm}
          onEditPress={(item) => manager.openReplaceModal(item.data.provider)}
          editDialogTitle={`${t('settings.apiKey.replace')} ${providerLabel}`}
          onEditSubmit={handleSave}
          getEditAccessibilityLabel={(item) =>
            `${t('settings.apiKey.replace')} ${settings.providerNames[item.data.provider]}`
          }
          isSubmitting={settings.isSubmitting}
          errorMessage={settings.isError ? settings.errorMessage : undefined}
          renderRemoveConfirmation={renderRemoveConfirmation}
          removeSubmitLabel={t('general.delete')}
          onRemovePress={(item) => manager.openRemoveModal(item.data.provider)}
          removeDialogTitle={`${t('settings.apiKey.remove')} ${removeProviderLabel}`}
          onRemoveConfirm={handleRemove}
          getRemoveAccessibilityLabel={(item) =>
            `${t('settings.apiKey.remove')} ${settings.providerNames[item.data.provider]}`
          }
        />
      )}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  cardList: {
    minWidth: 620,
    maxWidth: 800,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: theme.colors.onSurface,
  },
  removeConfirmationText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  progressIndicator: {
    alignSelf: 'center',
  },
}));
