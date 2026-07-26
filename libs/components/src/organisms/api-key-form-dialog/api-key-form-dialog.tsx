import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import React, { useRef } from 'react';
import { Linking, Text, type TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../atoms/button/button';
import { RadioGroup } from '../../molecules/radio-group/radio-group';
import { SubmittingIndicator } from '../../molecules/submitting-indicator/submitting-indicator';
import { TextField } from '../../molecules/text-field/text-field';
import { Dialog } from '../dialog/dialog';
import type { ApiKeyFormDialogProps } from './api-key-form-dialog.types';

/**
 * ApiKeyFormDialog — add/replace key modal (provider pick for add; fixed provider for replace).
 */
export const ApiKeyFormDialog = ({
  open,
  onClose,
  formMode,
  formProvider,
  unsavedProviders,
  apiKey,
  onApiKeyChange,
  onSelectProvider,
  isSubmitting = false,
  isSaveDisabled,
  onSave,
  guidanceUrls,
  providerNameKeys,
}: ApiKeyFormDialogProps) => {
  const { t } = useLocalization();
  const providerLabel = (p: AiProvider) => t(providerNameKeys[p]);
  const textFieldRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (formProvider && textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, [formProvider]);

  return (
    <Dialog
      open={open}
      headline={
        formMode === 'replace' && formProvider
          ? `${t('settings.apiKey.replace')} ${providerLabel(formProvider)}`
          : t('settings.apiKey.manager.addNew')
      }
      cancelLabel={t('settings.apiKey.removeConfirmCancelAction')}
      actions={
        <View style={styles.actionsRow}>
          {isSubmitting ? null : (
            <>
              <Button variant="text" disabled={isSubmitting} onPress={onClose}>
                {t('settings.apiKey.removeConfirmCancelAction')}
              </Button>

              <Button disabled={isSaveDisabled} onPress={onSave}>
                {t('settings.apiKey.save')}
              </Button>
            </>
          )}
        </View>
      }
    >
      <View style={styles.form}>
        {isSubmitting ? (
          <SubmittingIndicator />
        ) : (
          <>
            {formMode === 'add' ? (
              <RadioGroup
                accessibilityLabel={t('settings.apiKey.manager.selectProvider')}
                options={unsavedProviders.map((p) => ({
                  value: p,
                  label: providerLabel(p),
                }))}
                value={formProvider ?? undefined}
                onChange={(v) => {
                  onSelectProvider(v as AiProvider);
                }}
              />
            ) : formProvider ? (
              <Text style={styles.providerLabel}>{providerLabel(formProvider)}</Text>
            ) : null}
            <TextField
              ref={textFieldRef}
              label={t('settings.apiKey.inputLabel')}
              accessibilityLabel={t('settings.apiKey.inputLabel')}
              value={apiKey}
              onChangeText={onApiKeyChange}
              disabled={isSubmitting || !formProvider}
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
          </>
        )}
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create((theme) => ({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s3,
  },
  form: {
    gap: theme.spacing.s3,
  },
  providerLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
}));
