import type { CardListDialogState } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { useCardListWithABMDialogContext } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { Dialog } from '../../organisms/dialog/dialog';
import { SubmittingIndicator } from '../submitting-indicator/submitting-indicator';

type CardListWithABMDialogRemoveProps<TItem> = {
  open: boolean;
  dialogState: CardListDialogState<TItem>;
  onClose?: () => void;
};

const EMPTY_DIALOG_ACTIONS = <></>;

export function CardListWithABMDialogRemove<TItem>({
  open,
  dialogState,
  onClose,
}: CardListWithABMDialogRemoveProps<TItem>) {
  const {
    removeDialogTitle,
    removeSubmitLabel,
    removeCancelLabel,
    isSubmitting,
    renderRemoveConfirmation,
    onRemoveConfirm,
  } = useCardListWithABMDialogContext<TItem>();

  const handleRemoveConfirm = () => {
    if (dialogState?.type === 'remove') {
      onRemoveConfirm(dialogState.item);
    }
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      actions={isSubmitting ? EMPTY_DIALOG_ACTIONS : undefined}
      headline={removeDialogTitle}
      cancelLabel={removeCancelLabel}
      confirmLabel={removeSubmitLabel}
      onClose={isSubmitting ? undefined : onClose}
      onConfirm={handleRemoveConfirm}
    >
      {dialogState?.type === 'remove' ? (
        isSubmitting ? (
          <SubmittingIndicator />
        ) : (
          renderRemoveConfirmation(dialogState.item)
        )
      ) : null}
    </Dialog>
  );
}
