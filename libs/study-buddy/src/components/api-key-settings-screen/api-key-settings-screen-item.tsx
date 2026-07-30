import type { CardListItem } from '@helsoft/components';
import type { AiProvider, SavedProviderKey } from '@helsoft/types';
import React from 'react';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const mapSavedKeysToItems = (
  savedKeys: SavedProviderKey[],
  providerNames: Record<AiProvider, string>,
  getSavedStatusLabel: (provider: AiProvider, updatedAt: string) => string,
  enabledProviderIds: AiProvider[],
  disabledLabel: string,
): CardListItem<SavedProviderKey>[] =>
  savedKeys.map((key) => {
    const label = getSavedStatusLabel(key.provider, key.updatedAt);
    const isEnabled = enabledProviderIds.includes(key.provider);
    return {
      id: key.provider,
      disabled: !isEnabled,
      content: (
        <Content
          providerName={providerNames[key.provider]}
          label={label}
          disabledLabel={isEnabled ? undefined : disabledLabel}
        />
      ),
      accessibleLabel: label,
      showEditButton: true,
      showRemoveButton: true,
      data: key,
    };
  });

type ContentProps = {
  providerName: string;
  label: string;
  disabledLabel?: string;
};

const Content = React.memo(({ providerName, label, disabledLabel }: ContentProps) => (
  <>
    <Text style={styles.title}>{providerName}</Text>
    <Text>{label}</Text>
    {disabledLabel ? <Text>{disabledLabel}</Text> : null}
  </>
));

const styles = StyleSheet.create((theme) => ({
  title: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onPrimary,
    marginBottom: theme.spacing.s2,
  },
}));
