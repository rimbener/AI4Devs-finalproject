import type { CardListDialogState } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { useCardListWithABMDialogContext } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { Dialog } from '../../organisms/dialog/dialog';
import { SubmittingIndicator } from '../submitting-indicator/submitting-indicator';

type CardListWithABMDialogEditProps<TItem> = {
  open: boolean;
  dialogState: CardListDialogState<TItem>;
  onClose?: () => void;
};

const EMPTY_DIALOG_ACTIONS = <></>;

export function CardListWithABMDialogEdit<TItem>({
  open,
  onClose,
  dialogState,
}: CardListWithABMDialogEditProps<TItem>) {
  const {
    editDialogTitle,
    editSubmitLabel,
    editCancelLabel,
    isSubmitting,
    renderEditForm,
    onEditSubmit,
  } = useCardListWithABMDialogContext<TItem>();

  const handleEditConfirm = () => {
    if (dialogState?.type === 'edit') {
      onEditSubmit(dialogState.item);
    }
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      actions={isSubmitting ? EMPTY_DIALOG_ACTIONS : undefined}
      headline={editDialogTitle}
      cancelLabel={editCancelLabel}
      confirmLabel={editSubmitLabel}
      onClose={isSubmitting ? undefined : onClose}
      onConfirm={handleEditConfirm}
    >
      {dialogState?.type === 'edit' ? (
        isSubmitting ? (
          <SubmittingIndicator />
        ) : (
          renderEditForm(dialogState.item)
        )
      ) : null}
    </Dialog>
  );
}
