import type { ReactNode } from 'react';

/**
 * Props for a generic card-list row: a `Card` wrapping arbitrary `content` plus optional
 * edit/remove icon affordances. Fully flat/primitive — no organism import — so this molecule
 * stays portable and reusable (mirrors `pdf-document-list-item.types.ts`'s flat shape).
 * Callers resolve their own accessible-name strings and press handlers before passing them in
 * (no builder-function/generic-item plumbing here); testIDs, if needed, are supplied by the
 * caller too, the same way `Card`'s own `testID` prop works.
 */
export type CardListRowProps = {
  content: ReactNode;
  disabled?: boolean;
  showEditButton?: boolean;
  showRemoveButton?: boolean;
  onEditPress: () => void;
  onRemovePress: () => void;
  editAccessibilityLabel: string;
  removeAccessibilityLabel: string;
  /** testID for the row's `Card` wrapper. */
  testID?: string;
  /** testID for the edit icon's wrapper view. */
  editTestID?: string;
  /** testID for the remove icon's wrapper view. */
  removeTestID?: string;
};
