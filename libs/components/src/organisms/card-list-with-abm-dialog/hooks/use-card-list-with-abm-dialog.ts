import React from 'react';
import type { CardListDialogState, CardListItem } from '../card-list-with-abm-dialog.types';
import { useCardListWithABMDialogContext } from './card-list-with-abm-dialog.context';
import {
  cardListWithABMDialogInitialState,
  cardListWithABMDialogReducer,
} from './use-card-list-with-abm-dialog.reducer';

type DialogResponse = {
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
};

const EMPTY_DIALOG_RESPONSE: DialogResponse = {
  title: '',
  submitLabel: '',
  cancelLabel: '',
  onSubmit: undefined,
};

export const useCardListWithABMDialog = <TItem>({
  initialDialogState,
}: {
  initialDialogState: CardListDialogState;
}) => {
  const [state, dispatch] = React.useReducer(
    cardListWithABMDialogReducer<TItem>,
    cardListWithABMDialogInitialState<TItem>(initialDialogState),
  );

  const {
    addDialogTitle,
    addSubmitLabel,
    addCancelLabel,
    editDialogTitle,
    editSubmitLabel,
    editCancelLabel,
    removeDialogTitle,
    removeSubmitLabel,
    removeCancelLabel,
    isSubmitting,
    onEditPress,
    onRemovePress,
    onAddPress,
    onEditSubmit,
    onRemoveConfirm,
    onAddSubmit,
  } = useCardListWithABMDialogContext<TItem>();

  const openAddDialog = React.useCallback(
    () => {
      onAddPress?.();
      dispatch({ type: 'open-add' });
    },
    // Stryker disable next-line ArrayDeclaration: dispatch is referentially stable for the
    // component's lifetime — the dependency array's contents can never observably change
    // identity or behavior of this callback.
    [onAddPress],
  );

  const openEditDialog = React.useCallback(
    (item: CardListItem<TItem>) => {
      onEditPress?.(item);
      dispatch({ type: 'open-edit', item });
    },
    // Stryker disable next-line ArrayDeclaration: same dispatch-identity guarantee as above.
    [onEditPress],
  );

  const openRemoveDialog = React.useCallback(
    (item: CardListItem<TItem>) => {
      onRemovePress?.(item);
      dispatch({ type: 'open-remove', item });
    },
    // Stryker disable next-line ArrayDeclaration: same dispatch-identity guarantee as above.
    [onRemovePress],
  );

  const closeDialog = React.useCallback(
    () => {
      dispatch({ type: 'close' });
    },
    // Stryker disable next-line ArrayDeclaration: same dispatch-identity guarantee as above.
    [],
  );
  const prevDialogRef = React.useRef<DialogResponse>(null);

  const dialog: DialogResponse = React.useMemo(() => {
    switch (state.dialogType) {
      case 'add':
        return {
          title: addDialogTitle,
          submitLabel: addSubmitLabel,
          cancelLabel: addCancelLabel,
          onSubmit: () => {
            dispatch({ type: 'submit' });
            onAddSubmit?.();
          },
        };
      case 'edit':
        return {
          title: editDialogTitle,
          submitLabel: editSubmitLabel,
          cancelLabel: editCancelLabel,
          onSubmit: () => {
            dispatch({ type: 'submit' });
            onEditSubmit?.();
          },
        };
      case 'remove':
        return {
          title: removeDialogTitle,
          submitLabel: removeSubmitLabel,
          cancelLabel: removeCancelLabel,
          onSubmit: () => {
            dispatch({ type: 'submit' });
            onRemoveConfirm?.();
          },
        };
      default:
        return {
          ...(prevDialogRef.current ?? EMPTY_DIALOG_RESPONSE),
          onSubmit: undefined,
        };
    }
  }, [
    state.dialogType,
    addDialogTitle,
    addSubmitLabel,
    addCancelLabel,
    editDialogTitle,
    editSubmitLabel,
    editCancelLabel,
    removeDialogTitle,
    removeSubmitLabel,
    removeCancelLabel,
    onAddSubmit,
    onEditSubmit,
    onRemoveConfirm,
  ]);

  React.useEffect(() => {
    prevDialogRef.current = dialog;
  }, [dialog]);

  React.useEffect(() => {
    if (isSubmitting && state.dialogState === 'open') {
      dispatch({ type: 'submit' });
    }
  }, [isSubmitting, state.dialogState]);

  React.useEffect(() => {
    if (!isSubmitting) {
      closeDialog();
    }
  }, [isSubmitting, closeDialog]);

  return {
    dialogType: state.dialogType,
    dialogItem: state.dialogItem,
    dialogState: state.dialogState,
    openAddDialog,
    openEditDialog,
    openRemoveDialog,
    closeDialog,
    dialog,
  };
};
