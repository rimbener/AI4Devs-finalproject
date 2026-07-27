import { useCallback, useState } from 'react';
import type { CardListItem } from './card-list-with-abm-dialog.types';

/**
 * Single discriminated-union state (spec.md's Open decisions / `state.mdc`) — one state
 * variable, not `useReducer` (not ≥3 independently-changing fields). Rules out an invalid
 * "both dialogs open" state by construction. Not exported (types.mdc/component-split.mdc —
 * hook-private; the `.tsx` consumes it only via the hook's inferred return shape).
 */
type CardListDialogState<TItem> = {
  type: 'edit' | 'remove';
  item: CardListItem<TItem>;
} | null;

/**
 * Owns which (if any) edit/remove dialog is open and for which item. Handlers (onPress
 * wiring) stay in `card-list-with-abm-dialog.tsx` per `component-split.mdc`.
 *
 * `isOpen` is tracked separately from `dialogState` (post-`pr_ready` bug-fix, spec.md's Open
 * decisions, `@s19`/`@s20`): the shared `Dialog` organism's `Modal` fades out over its own
 * animation duration once `open` goes false, but `dialogState` used to be nulled synchronously
 * by `closeDialog`, so the dialog's body went blank mid-fade. `closeDialog` now only flips
 * `isOpen` to `false` — it never clears `dialogState` — so the last-known `{type, item}` stays
 * available for the remainder of the close transition; only the next `openEditDialog`/
 * `openRemoveDialog` call ever replaces it. Two state variables, not `useReducer` (only 2
 * independently-changing fields, below `state.mdc`'s ≥3 threshold).
 */
export const useCardListWithABMDialog = <TItem>() => {
  const [dialogState, setDialogState] = useState<CardListDialogState<TItem>>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openEditDialog = useCallback(
    (item: CardListItem<TItem>) => {
      setDialogState({ type: 'edit', item });
      setIsOpen(true);
    },
    // Stryker disable next-line ArrayDeclaration: setDialogState/setIsOpen are React state
    // setters, referentially stable for the component's lifetime — the dependency array's
    // contents can never observably change identity or behavior of this callback.
    [],
  );

  const openRemoveDialog = useCallback(
    (item: CardListItem<TItem>) => {
      setDialogState({ type: 'remove', item });
      setIsOpen(true);
    },
    // Stryker disable next-line ArrayDeclaration: same setState-identity guarantee as above.
    [],
  );

  const closeDialog = useCallback(
    () => {
      setIsOpen(false);
    },
    // Stryker disable next-line ArrayDeclaration: same setState-identity guarantee as above.
    [],
  );

  return { dialogState, isOpen, openEditDialog, openRemoveDialog, closeDialog };
};
