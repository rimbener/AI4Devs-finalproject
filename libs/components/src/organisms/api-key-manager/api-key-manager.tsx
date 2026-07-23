import { useLocalization } from '@helsoft/localization';
import { AI_PROVIDERS, type AiProvider } from '@helsoft/types';
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
 * Shows one masked row per saved provider + an add section for unsaved providers.
 * All copy and URLs come from the wiring layer (props + useLocalization).
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
    formProvider,
    setFormProvider,
    apiKey,
    setApiKey,
    confirmingRemove,
    setConfirmingRemove,
    savedProviders,
    unsavedProviders,
    allSaved,
    isSaveDisabled,
  } = useApiKeyManager({ savedKeys, isSubmitting });

  const providerLabel = (p: AiProvider) => t(providerNameKeys[p]);

  const handleSelectProvider = (p: AiProvider) => {
    setFormProvider(p);
    setApiKey('');
  };

  const handleReplace = (p: AiProvider) => {
    setFormProvider(p);
    setApiKey('');
  };

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

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorBannerText} accessibilityLiveRegion="assertive">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Saved key rows — fixed provider order (groq→openai→anthropic→google→xai→deepseek) */}
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
                onPress={() => handleReplace(p)}
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

      {/* Add / replace form — shown when a provider is active */}
      {formProvider ? (
        <View style={styles.form}>
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
          {guidanceUrls[formProvider] && !savedProviders.has(formProvider) ? (
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
          <View style={styles.actionsRow}>
            <Button disabled={isSaveDisabled} onPress={handleSave}>
              {t('settings.apiKey.save')}
            </Button>
            {isSubmitting ? (
              <Text accessibilityLiveRegion="polite">{t('settings.apiKey.saving')}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Add section — hidden when all 6 providers are saved */}
      {!allSaved ? (
        <View style={styles.addSection}>
          <Text style={styles.addHeading}>{t('settings.apiKey.manager.addHeading')}</Text>
          {savedKeys.length === 0 ? (
            <Text style={styles.emptyMessage}>{t('settings.apiKey.manager.emptyMessage')}</Text>
          ) : null}
          <RadioGroup
            accessibilityLabel={t('settings.apiKey.manager.selectProvider')}
            options={unsavedProviders.map((p) => ({
              value: p,
              label: providerLabel(p),
            }))}
            value={formProvider ?? undefined}
            onChange={(v) => handleSelectProvider(v as AiProvider)}
          />
        </View>
      ) : null}

      {/* Remove confirmation dialog */}
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
    gap: theme.spacing.s3,
  },
  form: {
    gap: theme.spacing.s3,
  },
  addSection: {
    gap: theme.spacing.s3,
  },
  addHeading: {
    ...theme.typography.titleSmall,
    color: theme.colors.onSurface,
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
