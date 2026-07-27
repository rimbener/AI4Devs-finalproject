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
 */
export const useCardListWithABMDialog = <TItem>() => {
  const [dialogState, setDialogState] = useState<CardListDialogState<TItem>>(null);

  const openEditDialog = useCallback((item: CardListItem<TItem>) => {
    setDialogState({ type: 'edit', item });
  }, []);

  const openRemoveDialog = useCallback((item: CardListItem<TItem>) => {
    setDialogState({ type: 'remove', item });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  return { dialogState, openEditDialog, openRemoveDialog, closeDialog };
};
