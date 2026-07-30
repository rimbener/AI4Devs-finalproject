import { memo, type ReactNode, useCallback } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { CardListRow } from '../../../molecules/card-list-row/card-list-row';
import {
  type CardListItem,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from '../card-list-with-abm-dialog.types';
import { useCardListWithABMDialogContext } from '../hooks/card-list-with-abm-dialog.context';

type CardListRowAdapterProps<TItem> = {
  item: CardListItem<TItem>;
  cardStyle?: StyleProp<ViewStyle>;
  onEditPress: (item: CardListItem<TItem>) => void;
  onRemovePress: (item: CardListItem<TItem>) => void;
};
/**
 * CardListRowAdapter — thin, organism-owned mapping from this organism's generic
 * `CardListItem<TItem>` (plus its accessible-name-builder/press-handler props) down to the
 * portable `CardListRow` molecule's flat prop shape: resolved accessible-name strings,
 * item-bound press callbacks, and this organism's own testID literals
 * (`cardListItemCardTestId`/`cardListItemEditTestId`/`cardListItemRemoveTestId`). Mirrors
 * `pdf-document-list.tsx`'s `PdfDocumentListRow` adapter — the molecule itself never sees
 * `CardListItem<TItem>`. Memoized + `useCallback`'d call-throughs for the same reason as that
 * precedent (full-review minor [perf]): keeps per-cell handler identity stable across parent
 * `FlatList` re-renders.
 */
export const CardListRowAdapter = memo(function CardListRowAdapter<TItem>({
  item,
  cardStyle,
  onEditPress,
  onRemovePress,
}: CardListRowAdapterProps<TItem>) {
  const { getEditAccessibilityLabel, getRemoveAccessibilityLabel } =
    useCardListWithABMDialogContext<TItem>();
  const handleEditPress = useCallback(() => onEditPress(item), [onEditPress, item]);
  const handleRemovePress = useCallback(() => onRemovePress(item), [onRemovePress, item]);

  return (
    <CardListRow
      style={cardStyle}
      content={item.content}
      disabled={item.disabled}
      showEditButton={item.showEditButton}
      showRemoveButton={item.showRemoveButton}
      onEditPress={handleEditPress}
      onRemovePress={handleRemovePress}
      editAccessibilityLabel={getEditAccessibilityLabel(item)}
      removeAccessibilityLabel={getRemoveAccessibilityLabel(item)}
      testID={cardListItemCardTestId(item.id)}
      editTestID={cardListItemEditTestId(item.id)}
      removeTestID={cardListItemRemoveTestId(item.id)}
    />
  );
}) as <TItem>(props: CardListRowAdapterProps<TItem>) => ReactNode;
