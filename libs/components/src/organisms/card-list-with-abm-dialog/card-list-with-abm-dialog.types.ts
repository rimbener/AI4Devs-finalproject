import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * One row of `CardListWithABMDialog`. Generic over the caller's domain object (`TItem`) so
 * edit/remove callbacks receive it directly with no id lookup.
 * `accessibleLabel` is consumed by the `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`
 * builder props — it is part of the stable contract, not rendered directly.
 */
export type CardListItem<TItem> = {
  id: string;
  content?: ReactNode;
  accessibleLabel: string;
  disabled?: boolean;
  showEditButton?: boolean;
  showRemoveButton?: boolean;
  data: TItem;
};

/**
 * Full prop surface (spec.md) — chrome (title/list/add), edit/remove dialog wiring, per-action
 * accessible-name builders, and the `isSubmitting` in-flight state.
 */
export type CardListWithABMDialogProps = {
  onClose?: () => void;
  errorMessage?: string;
  submitDisabled?: boolean;
  showAddButton?: boolean;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  cardListStyle?: StyleProp<ViewStyle>;
  cardListContentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Discriminated-union dialog state (spec.md's Open decisions), managed together with
 * `dialogType`/`dialogItem` via `useReducer` in `use-card-list-with-abm-dialog.reducer.ts` —
 * three related fields changing together crosses `state.mdc`'s ≥3-field threshold. Rules out
 * an invalid "both dialogs open" state by construction. `add` carries no item (nothing exists
 * yet); `edit`/`remove` carry the item they act on.
 */
export type CardListDialogState = 'open' | 'closed' | 'submitting';

export type CardListDialogType = 'add' | 'edit' | 'remove';

export type CardListDialogItem<TItem> = CardListItem<TItem> | null;

export type CardListWithABMDialogStateProps<TItem> = {
  open: boolean;
  dialogState: CardListDialogState;
  dialogType: CardListDialogType;
  dialogItem: CardListItem<TItem>;
  onClose?: () => void;
};
