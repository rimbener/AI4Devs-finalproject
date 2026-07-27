import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';

/**
 * Props for one `CardListWithABMDialog` row. The parent organism wires `onEditPress`/
 * `onRemovePress` to its own `openEditDialog`/`openRemoveDialog` (organism-level orchestration);
 * this molecule only forwards the tapped `item` to whichever callback fired.
 */
export type CardListRowProps<TItem> = {
  item: CardListItem<TItem>;
  onEditPress: (item: CardListItem<TItem>) => void;
  onRemovePress: (item: CardListItem<TItem>) => void;
  getEditAccessibilityLabel: (item: CardListItem<TItem>) => string;
  getRemoveAccessibilityLabel: (item: CardListItem<TItem>) => string;
};
