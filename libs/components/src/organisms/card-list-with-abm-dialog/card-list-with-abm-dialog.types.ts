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
 * Props for this slice only — chrome (title/list/add) with no dialog wiring yet.
 * task-2/3 add `renderEditForm`/`onEditSubmit`/`renderRemoveConfirmation`/`onRemoveConfirm`/
 * the accessibility-label builders/`isSubmitting` to this same type (per spec.md's full surface).
 */
export type CardListWithABMDialogProps<TItem> = {
  title: string;
  items: CardListItem<TItem>[];
  addButtonLabel: string;
  onAddPress: () => void;
  /** Rendered in place of the list when `items` is empty; omitted renders nothing there. */
  emptyStateMessage?: string;
};
