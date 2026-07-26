import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { Text } from 'react-native';
import { SubmittingIndicator } from '../../molecules/submitting-indicator/submitting-indicator';
import { Dialog } from '../dialog/dialog';

type ApiKeyManagerRemoveProps = {
  isSubmitting: boolean;
  confirmingRemove: AiProvider | null;
  setConfirmingRemove: (provider: AiProvider | null) => void;
  onRemove: (provider: AiProvider) => void;
};

export const ApiKeyManagerRemove = ({
  isSubmitting,
  confirmingRemove,
  setConfirmingRemove,
  onRemove,
}: ApiKeyManagerRemoveProps) => {
  const { t } = useLocalization();

  if (!confirmingRemove) {
    return null;
  }

  return (
    <Dialog
      open={confirmingRemove !== null}
      onClose={() => setConfirmingRemove(null)}
      headline={t('settings.apiKey.removeConfirmHeadline')}
      confirmLabel={t('settings.apiKey.removeConfirmAction')}
      cancelLabel={t('settings.apiKey.removeConfirmCancelAction')}
      onConfirm={() => onRemove(confirmingRemove)}
    >
      {isSubmitting ? (
        <SubmittingIndicator />
      ) : (
        <Text>{t('settings.apiKey.removeConfirmBody')}</Text>
      )}
    </Dialog>
  );
};
