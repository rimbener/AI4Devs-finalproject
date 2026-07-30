import type { ReactNode } from 'react';

import type { CardListItem } from '../card-list-with-abm-dialog.types';

/**
 * Full prop surface (spec.md) — chrome (title/list/add), edit/remove dialog wiring, per-action
 * accessible-name builders, and the `isSubmitting` in-flight state.
 */
export type CardListWithABMDialogValue<TItem> = {
  title: string;
  items: CardListItem<TItem>[];
  addButtonLabel: string;
  /** Rendered in place of the list when `items` is empty; omitted renders nothing there. */
  emptyStateMessage?: string;

  /** Body of the add dialog. */
  renderAddForm: () => ReactNode;
  addDialogTitle: string;
  addSubmitLabel?: string;
  addCancelLabel?: string;
  onAddPress?: () => void;
  /** Called when the add dialog's submit button is pressed; the dialog then closes. */
  onAddSubmit?: () => void;

  /** Body of the edit dialog for a given item. */
  renderEditForm: (item: CardListItem<TItem>) => ReactNode;
  editDialogTitle: string;
  editSubmitLabel?: string;
  editCancelLabel?: string;
  onEditPress?: (item: CardListItem<TItem>) => void;
  /** Called when the edit dialog's submit button is pressed; the dialog then closes. */
  onEditSubmit?: () => void;

  /** Body of the remove-confirmation dialog for a given item. */
  renderRemoveConfirmation: (item: CardListItem<TItem>) => ReactNode;
  removeDialogTitle?: string;
  removeSubmitLabel?: string;
  removeCancelLabel?: string;
  onRemovePress?: (item: CardListItem<TItem>) => void;
  /** Called when the remove dialog's submit button is pressed; the dialog then closes. */
  onRemoveConfirm?: () => void;

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
  showAddButton?: boolean;
};
