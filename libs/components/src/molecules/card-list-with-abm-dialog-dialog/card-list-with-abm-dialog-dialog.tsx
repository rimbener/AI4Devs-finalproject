import { useLocalization } from '@helsoft/localization';
import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../atoms';
import { ErrorBanner } from '../../atoms/error-banner/error-banner';
import type {
  CardListDialogState,
  CardListDialogType,
  CardListItem,
} from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { useCardListWithABMDialogContext } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { Dialog } from '../../organisms/dialog/dialog';
import { SubmittingIndicator } from '../submitting-indicator/submitting-indicator';

type CardListWithABMDialogDialogProps<TItem> = {
  open: boolean;
  dialogState: CardListDialogState | null;
  dialogType: CardListDialogType | null;
  dialogItem: CardListItem<TItem> | null;
  onClose?: () => void;
  onSubmit?: () => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  errorMessage?: string;
};

const EMPTY_DIALOG_ACTIONS = <></>;

export function CardListWithABMDialogDialog<TItem>({
  open,
  submitDisabled,
  errorMessage,
  onClose,
  title,
  submitLabel,
  cancelLabel,
  dialogType,
  dialogState,
  dialogItem,
  onSubmit,
}: CardListWithABMDialogDialogProps<TItem>) {
  const { t } = useLocalization();

  const { renderEditForm, renderAddForm, renderRemoveConfirmation } =
    useCardListWithABMDialogContext<TItem>();

  const actions = React.useMemo(
    () =>
      errorMessage ? (
        <Button variant="text" onPress={onClose}>
          {t('general.close')}
        </Button>
      ) : dialogState === 'submitting' || dialogState === 'closed' ? (
        EMPTY_DIALOG_ACTIONS
      ) : undefined,
    [errorMessage, dialogState, onClose, t],
  );

  return (
    <Dialog
      open={open}
      actions={actions}
      headline={title}
      cancelLabel={cancelLabel ?? t('general.cancel')}
      confirmLabel={submitLabel ?? t('general.save')}
      confirmDisabled={submitDisabled}
      onClose={dialogState === 'submitting' ? undefined : onClose}
      onConfirm={onSubmit}
    >
      {errorMessage ? (
        <ErrorBanner errorMessage={errorMessage} />
      ) : dialogState === 'submitting' ? (
        <SubmittingIndicator />
      ) : dialogType === 'edit' ? (
        dialogItem ? (
          renderEditForm(dialogItem)
        ) : null
      ) : dialogType === 'add' ? (
        renderAddForm()
      ) : dialogType === 'remove' ? (
        dialogItem ? (
          renderRemoveConfirmation(dialogItem)
        ) : null
      ) : (
        <View style={styles.spacer} />
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create((theme) => ({
  spacer: {
    height: theme.spacing.s10,
  },
}));
