import type { ReactNode } from 'react';

/**
 * One row of `CardListWithABMDialog`. Generic over the caller's domain object (`TItem`) so
 * edit/remove callbacks (wired in task-2/3) receive it directly with no id lookup.
 * `accessibleLabel` is consumed by the (task-2/3) `getEdit/RemoveAccessibilityLabel` builder
 * props — it is part of the stable contract now even though this slice doesn't read it yet.
 */
export type CardListItem<TItem> = {
  id: string;
  content: ReactNode;
  accessibleLabel: string;
  disabled?: boolean;
  showEditButton?: boolean;
  showRemoveButton?: boolean;
  data: TItem;
};

/**
 * Props for this + prior slices — chrome (title/list/add) plus edit/remove dialog wiring.
 * task-3 adds the accessibility-label builder props/`isSubmitting` (per spec.md's full surface).
 */
export type CardListWithABMDialogProps<TItem> = {
  title: string;
  items: CardListItem<TItem>[];
  addButtonLabel: string;
  onAddPress: () => void;
  /** Rendered in place of the list when `items` is empty; omitted renders nothing there. */
  emptyStateMessage?: string;

  /** Body of the edit dialog for a given item. */
  renderEditForm: (item: CardListItem<TItem>) => ReactNode;
  editDialogTitle: string;
  editSubmitLabel: string;
  editCancelLabel: string;
  /** Called when the edit dialog's submit button is pressed; the dialog then closes. */
  onEditSubmit: (item: CardListItem<TItem>) => void;

  /** Body of the remove-confirmation dialog for a given item. */
  renderRemoveConfirmation: (item: CardListItem<TItem>) => ReactNode;
  removeDialogTitle: string;
  removeSubmitLabel: string;
  removeCancelLabel: string;
  /** Called when the remove dialog's submit button is pressed; the dialog then closes. */
  onRemoveConfirm: (item: CardListItem<TItem>) => void;
};
