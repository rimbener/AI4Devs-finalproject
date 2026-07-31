import { Button, RadioGroup, TextField } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import React, { useRef } from 'react';
import { Linking, Text, type TextInput } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { focusApiKeyField, isSafeExternalUrl } from './add-api-key.helpers';
import type { ApiKeyFormMode } from './hooks/use-api-key-manager.reducer';

type AddApiKeyProps = {
  formMode: ApiKeyFormMode;
  providerNames: Record<AiProvider, string>;
  unsavedProviders: AiProvider[];
  formProvider: AiProvider | null;
  onSelectProvider: (p: AiProvider) => void;
  apiKey: string;
  onApiKeyChange: (text: string) => void;
  isSubmitting: boolean;
  guidanceUrls: Partial<Record<AiProvider, string>>;
};

export const AddApiKey = ({
  formMode,
  providerNames,
  unsavedProviders,
  formProvider,
  onSelectProvider,
  apiKey,
  guidanceUrls,
  onApiKeyChange,
  isSubmitting,
}: AddApiKeyProps) => {
  const { t } = useLocalization();
  const textFieldRef = useRef<TextInput>(null);

  const getProviderLabel = (p: AiProvider) => providerNames[p];

  React.useEffect(() => {
    focusApiKeyField(textFieldRef, formProvider);
  }, [formProvider]);

  return (
    <>
      {formMode === 'add' ? (
        <RadioGroup
          accessibilityLabel={t('settings.apiKey.manager.selectProvider')}
          options={unsavedProviders.map((p) => ({
            value: p,
            label: getProviderLabel(p),
          }))}
          value={formProvider ?? undefined}
          onChange={(v) => {
            onSelectProvider(v as AiProvider);
          }}
        />
      ) : formProvider ? (
        <Text style={styles.providerLabel}>{getProviderLabel(formProvider)}</Text>
      ) : null}

      <TextField
        ref={textFieldRef}
        label={t('settings.apiKey.inputLabel')}
        accessibilityLabel={t('settings.apiKey.inputLabel')}
        value={apiKey}
        onChangeText={onApiKeyChange}
        disabled={isSubmitting || !formProvider}
        accessibilityState={{ disabled: isSubmitting || !formProvider }}
        secureTextEntry
        style={styles.textField}
        autoCapitalize="none"
      />

      {formProvider && guidanceUrls[formProvider] ? (
        <Button
          variant="text"
          onPress={() => {
            const url = guidanceUrls[formProvider];
            // Only ever open http(s) urls — the catalog is admin-managed today, but this guards
            // against a future data-entry mistake or compromise reaching Linking.openURL with a
            // non-http(s) scheme (OWASP A08-adjacent, review.md finding 8).
            if (!url || !isSafeExternalUrl(url)) return;
            // Best-effort UX affordance: if the device can't open the link (e.g. no browser/app
            // registered for the scheme), there is no actionable recovery surface on this screen
            // and the OS itself typically surfaces its own error UI for an unhandleable url —
            // intentional silent no-op (review.md finding 9), not an unhandled failure.
            void Linking.openURL(url).catch(() => {});
          }}
        >
          {t('settings.apiKey.guidanceTemplate', {
            provider: getProviderLabel(formProvider),
          })}
        </Button>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  providerLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  textField: {
    marginTop: theme.spacing.s4,
  },
}));
