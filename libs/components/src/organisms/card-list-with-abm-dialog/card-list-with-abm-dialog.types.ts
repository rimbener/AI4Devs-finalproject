import type { ReactNode } from 'react';

/**
 * One row of `CardListWithABMDialog`. Generic over the caller's domain object (`TItem`) so
 * edit/remove callbacks receive it directly with no id lookup.
 * `accessibleLabel` is consumed by the `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`
 * builder props — it is part of the stable contract, not rendered directly.
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
 * Full prop surface (spec.md) — chrome (title/list/add), edit/remove dialog wiring, per-action
 * accessible-name builders, and the `isSubmitting` in-flight state.
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

  /** Builds the edit icon's accessible name for a given item (caller owns phrasing/i18n). */
  getEditAccessibilityLabel: (item: CardListItem<TItem>) => string;
  /** Builds the remove icon's accessible name for a given item (caller owns phrasing/i18n). */
  getRemoveAccessibilityLabel: (item: CardListItem<TItem>) => string;

  /**
   * Whether the open dialog (edit or remove) is mid-submit. While true, that dialog's body is
   * replaced entirely by `SubmittingIndicator`, its cancel/submit buttons are hidden, and it
   * cannot be dismissed via scrim/Escape (spec.md's Open decisions).
   */
  isSubmitting: boolean;
};
