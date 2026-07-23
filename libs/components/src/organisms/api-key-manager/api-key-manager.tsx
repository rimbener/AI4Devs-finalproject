import { useLocalization } from '@helsoft/localization';
import { AI_PROVIDERS, type AiProvider } from '@helsoft/types';
import { useEffect, useRef } from 'react';
import { Linking, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '../../atoms/button/button';
import { ProgressIndicator } from '../../atoms/progress-indicator/progress-indicator';
import { RadioGroup } from '../../molecules/radio-group/radio-group';
import { TextField } from '../../molecules/text-field/text-field';
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
    setFormProvider,
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

  const providerLabel = (p: AiProvider) => t(providerNameKeys[p]);

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
          {t('settings.apiKey.loadingStatus')}
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
          {AI_PROVIDERS.filter((p) => savedProviders.has(p)).map((p) => {
            const key = savedKeys.find((k) => k.provider === p);
            if (!key) return null;
            const name = providerLabel(p);
            return (
              <View key={p} style={styles.row}>
                <Text style={styles.savedStatusLabel}>{getSavedStatusLabel(p, key.updatedAt)}</Text>
                <View style={styles.actionsRow}>
                  <Button
                    disabled={isSubmitting}
                    variant="outlined"
                    accessibilityLabel={`${t('settings.apiKey.replace')} ${name}`}
                    onPress={() => openReplaceModal(p)}
                  >
                    {t('settings.apiKey.replace')}
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    variant="text"
                    accessibilityLabel={`${t('settings.apiKey.remove')} ${name}`}
                    onPress={() => setConfirmingRemove(p)}
                  >
                    {t('settings.apiKey.remove')}
                  </Button>
                </View>
              </View>
            );
          })}
          {addButton}
        </>
      )}

      <Dialog
        open={modalOpen}
        onClose={closeModal}
        headline={
          formMode === 'replace' && formProvider
            ? `${t('settings.apiKey.replace')} ${providerLabel(formProvider)}`
            : t('settings.apiKey.manager.addNew')
        }
        cancelLabel={t('settings.apiKey.removeConfirmCancelAction')}
        actions={
          <View style={styles.actionsRow}>
            <Button variant="text" onPress={closeModal}>
              {t('settings.apiKey.removeConfirmCancelAction')}
            </Button>
            <Button disabled={isSaveDisabled} onPress={handleSave}>
              {t('settings.apiKey.save')}
            </Button>
            {isSubmitting ? (
              <Text accessibilityLiveRegion="polite">{t('settings.apiKey.saving')}</Text>
            ) : null}
          </View>
        }
      >
        <View style={styles.form}>
          {formMode === 'add' ? (
            <RadioGroup
              accessibilityLabel={t('settings.apiKey.manager.selectProvider')}
              options={unsavedProviders.map((p) => ({
                value: p,
                label: providerLabel(p),
              }))}
              value={formProvider ?? undefined}
              onChange={(v) => {
                setFormProvider(v as AiProvider);
                setApiKey('');
              }}
            />
          ) : formProvider ? (
            <Text style={styles.savedStatusLabel}>{providerLabel(formProvider)}</Text>
          ) : null}
          <TextField
            label={t('settings.apiKey.inputLabel')}
            accessibilityLabel={t('settings.apiKey.inputLabel')}
            value={apiKey}
            onChangeText={setApiKey}
            disabled={isSubmitting}
            accessibilityState={{ disabled: isSubmitting }}
            secureTextEntry
            autoCapitalize="none"
          />
          {formMode === 'add' && formProvider && guidanceUrls[formProvider] ? (
            <Button
              variant="text"
              onPress={() => {
                const url = guidanceUrls[formProvider];
                if (url) void Linking.openURL(url).catch(() => {});
              }}
            >
              {t('settings.apiKey.guidanceTemplate', {
                provider: providerLabel(formProvider),
              })}
            </Button>
          ) : null}
        </View>
      </Dialog>

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

export const apiKeyManagerStyles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.s4,
  },
  empty: {
    gap: theme.spacing.s4,
  },
  row: {
    gap: theme.spacing.s2,
  },
  savedStatusLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
  form: {
    gap: theme.spacing.s3,
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

const styles = apiKeyManagerStyles;
