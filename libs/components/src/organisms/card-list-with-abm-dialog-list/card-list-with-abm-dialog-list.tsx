import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  type CardListItem,
} from '../card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { CardListRowAdapter } from '../card-list-with-abm-dialog/components/card-list-row-adapter';
import { useCardListWithABMDialogContext } from '../card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';

type CardListWithABMDialogListProps<TItem> = {
  openEditDialog: (item: CardListItem<TItem>) => void;
  openRemoveDialog: (item: CardListItem<TItem>) => void;
};

export function CardListWithABMDialogList<TItem>({
  openEditDialog,
  openRemoveDialog,
}: CardListWithABMDialogListProps<TItem>) {
  const { items, getEditAccessibilityLabel, getRemoveAccessibilityLabel } =
    useCardListWithABMDialogContext<TItem>();
  const keyExtractor = useCallback((item: CardListItem<TItem>) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: CardListItem<TItem> }) => (
      <CardListRowAdapter
        item={item}
        onEditPress={openEditDialog}
        onRemovePress={openRemoveDialog}
        getEditAccessibilityLabel={getEditAccessibilityLabel}
        getRemoveAccessibilityLabel={getRemoveAccessibilityLabel}
      />
    ),
    [openEditDialog, openRemoveDialog, getEditAccessibilityLabel, getRemoveAccessibilityLabel],
  );

  return (
    <FlatList
      testID={CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID}
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    flex: 1,
    padding: theme.spacing.s1,
  },
  listContent: {
    gap: theme.spacing.s3,
  },
}));
