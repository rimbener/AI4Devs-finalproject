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

/**
 * Grace period (review.md Mini-gate 3, finding 1) before treating a submit whose caller never
 * touches `isSubmitting` as settled. Must stay comfortably above React's own internal
 * effect-scheduling slices (a handful of ms) — a too-short delay can land in the same
 * macrotask pass as React's own scheduler and fire mid-flush, before a caller who *does* intend
 * to report async progress ever gets a chance to flip `isSubmitting` true.
 *
 * ACCEPTED RISK (review.md's "Full review — Round 1 (post-CI-fix)", finding 3): this timer races
 * two independent schedulers (this `setTimeout` vs. whatever schedules the caller's `isSubmitting`
 * prop update) rather than a deterministic signal. Traced end-to-end for the real consumer
 * (`ApiKeySettingsScreen` → `useApiKeySettings` → `useApiKey()`'s raw
 * `saveMutation.isPending || removeMutation.isPending`): React 18's auto-batching plus TanStack
 * Query v5's synchronous-pending-dispatch land both `dialogState === 'submitting'` and
 * `isSubmitting === true` in the *same* render for that call site today, so this timer never
 * actually fires for a genuine in-flight mutation right now. That safety margin is an
 * implementation-detail coincidence of both libraries' current internal scheduling, not a
 * contract either one promises — a future refactor that moves the mutation call site out of the
 * synchronous submit-handler stack (a `.then()`, an `await` before calling it, `startTransition`,
 * or a library upgrade deferring the pending-dispatch to a microtask) could reintroduce "dialog
 * closes while a real mutation is still in flight" undetected by any test existing at the time of
 * this note. See the fake-timer test below ("does not let a genuinely-delayed async submit be
 * mistaken for a synchronous one") for regression coverage of the current, accepted behavior.
 */
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
        // Only reachable pre-first-open (state.dialogType is null only in the initial state —
        // every reducer action afterward preserves whatever dialogType was already set, see
        // `use-card-list-with-abm-dialog.reducer.ts`'s `submit`/`close` cases), so there is never
        // a "previous" dialog content to fall back to here.
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

  // Exiting 'submitting' (review.md Mini-gate 3, findings 1/2). Two ways in: (a) a real async
  // caller's isSubmitting genuinely returns to false having actually been true — close
  // immediately, no delay (@s13 — the dedicated failure channel is `errorMessage`, so a settled
  // isSubmitting always means "done", not "show the form again"). (b) the caller's isSubmitting
  // stays false throughout — a synchronous/no-op submit handler (e.g. Storybook's Populated
  // story). Without the ref-gated grace tick below, this used to strand the dialog in
  // 'submitting' forever: the old effect only ever reacted to `isSubmitting` itself changing
  // value, which a caller that never touches it never does. The grace tick still lets a
  // genuinely-async caller's isSubmitting flip to true moments later intercept it (dialogState
  // stays 'submitting' the entire time regardless, so @s22's synchronous "still submitting
  // right after pressing submit" keeps holding either way).
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

    // A real macrotask delay, deliberately > React's own internal effect-scheduling slices (a
    // literal 0ms timer occasionally raced React's scheduler in this same macrotask queue,
    // firing mid-flush inside a single test's `act()` and flakily beating the "still submitting
    // right after submit" assertions above).
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
