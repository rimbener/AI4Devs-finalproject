import { createContext, type ReactNode, useContext } from 'react';

import type { CardListItem } from '../card-list-with-abm-dialog.types';

/**
 * Full prop surface (spec.md) — chrome (title/list/add), edit/remove dialog wiring, per-action
 * accessible-name builders, and the `isSubmitting` in-flight state.
 */
export type CardListWithABMDialogValue<TItem> = {
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

// createContext can't be generic — store as unknown; Provider/hook reintroduce TItem via cast.
const CardListWithABMDialogContext = createContext<CardListWithABMDialogValue<unknown> | null>(
  null,
);

type CardListWithABMDialogProviderProps<TItem> = {
  value: CardListWithABMDialogValue<TItem>;
  children: ReactNode;
};

export const CardListWithABMDialogProvider = <TItem,>({
  value,
  children,
}: CardListWithABMDialogProviderProps<TItem>) => (
  <CardListWithABMDialogContext.Provider value={value as CardListWithABMDialogValue<unknown>}>
    {children}
  </CardListWithABMDialogContext.Provider>
);

export const useCardListWithABMDialogContext = <TItem,>(): CardListWithABMDialogValue<TItem> => {
  const value = useContext(CardListWithABMDialogContext);
  if (!value) {
    throw new Error(
      'useCardListWithABMDialogContext must be used within CardListWithABMDialogProvider',
    );
  }

  return value as CardListWithABMDialogValue<TItem>;
};
