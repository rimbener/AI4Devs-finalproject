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

/** Grace ms before treating a submit that never flips `isSubmitting` as sync/settled. */
const SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS = 50;

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
    // Stryker disable next-line ArrayDeclaration: dispatch identity is stable.
    [onAddPress],
  );

  const openEditDialog = React.useCallback(
    (item: CardListItem<TItem>) => {
      onEditPress?.(item);
      dispatch({ type: 'open-edit', item });
    },
    // Stryker disable next-line ArrayDeclaration: dispatch identity is stable.
    [onEditPress],
  );

  const openRemoveDialog = React.useCallback(
    (item: CardListItem<TItem>) => {
      onRemovePress?.(item);
      dispatch({ type: 'open-remove', item });
    },
    // Stryker disable next-line ArrayDeclaration: dispatch identity is stable.
    [onRemovePress],
  );

  const closeDialog = React.useCallback(
    () => {
      dispatch({ type: 'close' });
    },
    // Stryker disable next-line ArrayDeclaration: dispatch identity is stable.
    [],
  );

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
        // Pre-first-open only (dialogType stays set after open; see reducer submit/close).
        return EMPTY_DIALOG_RESPONSE;
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
    if (isSubmitting && state.dialogState === 'open') {
      dispatch({ type: 'submit' });
    }
  }, [isSubmitting, state.dialogState]);

  // Exit 'submitting': (a) was async → close when isSubmitting falls; (b) never async → grace close.
  const wasReallySubmittingRef = React.useRef(false);

  React.useEffect(() => {
    if (state.dialogState !== 'submitting') {
      wasReallySubmittingRef.current = false;
      return;
    }

    if (isSubmitting) {
      wasReallySubmittingRef.current = true;
      return;
    }

    if (wasReallySubmittingRef.current) {
      closeDialog();
      return;
    }

    // >0ms — 0 raced React's scheduler mid-flush under act().
    const timeoutId = setTimeout(closeDialog, SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS);
    return () => clearTimeout(timeoutId);
  }, [state.dialogState, isSubmitting, closeDialog]);

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
