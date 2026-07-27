import { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../atoms/button/button';
import { Card } from '../../atoms/card/card';
import { IconButton } from '../../atoms/icon-button/icon-button';
import { layout } from '../../theme/spacing';
import { Dialog } from '../dialog/dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import { useCardListWithABMDialog } from './use-card-list-with-abm-dialog';

/** testID for the virtualized content list. */
export const CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID = 'card-list-with-abm-dialog-list';

/** testID for a row's `Card` wrapper (its opacity carries the disabled visual, @s2). */
export const cardListItemCardTestId = (id: string) => `card-list-with-abm-dialog-card-${id}`;
/** testID prefix for a row's edit icon (per-action accessible name arrives in task-2/3). */
export const cardListItemEditTestId = (id: string) => `card-list-with-abm-dialog-edit-${id}`;
/** testID prefix for a row's remove icon (per-action accessible name arrives in task-2/3). */
export const cardListItemRemoveTestId = (id: string) => `card-list-with-abm-dialog-remove-${id}`;

type CardListRowProps<TItem> = {
  item: CardListItem<TItem>;
  onEditPress: (item: CardListItem<TItem>) => void;
  onRemovePress: (item: CardListItem<TItem>) => void;
};

/**
 * CardListWithABMDialog — titled `Card` list with an add button and, per item, optional
 * edit/remove icon affordances, each opening the shared `Dialog` organism (edit-form /
 * remove-confirmation). Open-dialog state lives in `use-card-list-with-abm-dialog.ts` as a
 * single discriminated union (spec.md's Open decisions) — only one dialog can be open at a
 * time by construction. The per-action `getEdit/RemoveAccessibilityLabel` builder props and
 * `isSubmitting` land in task-3 — see spec.md; each icon keeps an interim
 * `item.accessibleLabel` name meanwhile.
 */
export const CardListWithABMDialog = <TItem,>({
  title,
  items,
  addButtonLabel,
  onAddPress,
  emptyStateMessage,
  renderEditForm,
  editDialogTitle,
  editSubmitLabel,
  editCancelLabel,
  onEditSubmit,
  renderRemoveConfirmation,
  removeDialogTitle,
  removeSubmitLabel,
  removeCancelLabel,
  onRemoveConfirm,
}: CardListWithABMDialogProps<TItem>) => {
  const { dialogState, openEditDialog, openRemoveDialog, closeDialog } =
    useCardListWithABMDialog<TItem>();

  const keyExtractor = useCallback((item: CardListItem<TItem>) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: CardListItem<TItem> }) => (
      <CardListRow item={item} onEditPress={openEditDialog} onRemovePress={openRemoveDialog} />
    ),
    [openEditDialog, openRemoveDialog],
  );

  const handleEditConfirm = () => {
    if (dialogState?.type === 'edit') {
      onEditSubmit(dialogState.item);
    }
    closeDialog();
  };

  const handleRemoveConfirm = () => {
    if (dialogState?.type === 'remove') {
      onRemoveConfirm(dialogState.item);
    }
    closeDialog();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Button icon="add" onPress={onAddPress} accessibilityLabel={addButtonLabel}>
          {addButtonLabel}
        </Button>
      </View>
      {items.length === 0 ? (
        emptyStateMessage ? (
          <Text style={styles.emptyText}>{emptyStateMessage}</Text>
        ) : null
      ) : (
        <FlatList
          testID={CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID}
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
      <Dialog
        open={dialogState?.type === 'edit'}
        onClose={closeDialog}
        headline={editDialogTitle}
        confirmLabel={editSubmitLabel}
        cancelLabel={editCancelLabel}
        onConfirm={handleEditConfirm}
      >
        {dialogState?.type === 'edit' ? renderEditForm(dialogState.item) : null}
      </Dialog>
      <Dialog
        open={dialogState?.type === 'remove'}
        onClose={closeDialog}
        headline={removeDialogTitle}
        confirmLabel={removeSubmitLabel}
        cancelLabel={removeCancelLabel}
        onConfirm={handleRemoveConfirm}
      >
        {dialogState?.type === 'remove' ? renderRemoveConfirmation(dialogState.item) : null}
      </Dialog>
    </View>
  );
};

/**
 * One row: `Card` wrapping the caller's content plus optional edit/remove icons.
 * Icons are wrapped in a local testID `View` rather than the shared `IconButton` atom
 * gaining a `testID` prop (atom-ban).
 * `item.accessibleLabel` is used as an interim accessible name for both icons this slice
 * (WCAG 4.1.2 — `IconButton` always renders `accessibilityRole="button"`, so an accessible
 * name must not be missing); task-3's `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`
 * builder props supersede this with a per-action label, not a second competing prop.
 */
const CardListRow = <TItem,>({ item, onEditPress, onRemovePress }: CardListRowProps<TItem>) => (
  <Card
    testID={cardListItemCardTestId(item.id)}
    style={item.disabled ? styles.disabledCard : undefined}
  >
    <View style={styles.row}>
      <View style={styles.content}>{item.content}</View>
      <View style={styles.actions}>
        {item.showEditButton ? (
          <View testID={cardListItemEditTestId(item.id)}>
            <IconButton
              icon="edit"
              size={layout.touchTarget}
              disabled={item.disabled}
              accessibilityLabel={item.accessibleLabel}
              onPress={() => onEditPress(item)}
            />
          </View>
        ) : null}
        {item.showRemoveButton ? (
          <View testID={cardListItemRemoveTestId(item.id)}>
            <IconButton
              icon="delete"
              size={layout.touchTarget}
              disabled={item.disabled}
              accessibilityLabel={item.accessibleLabel}
              onPress={() => onRemovePress(item)}
            />
          </View>
        ) : null}
      </View>
    </View>
  </Card>
);

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    gap: theme.spacing.s4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s3,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    flexShrink: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: theme.spacing.s3,
  },
  emptyText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
  },
  disabledCard: {
    opacity: theme.disabledOpacity,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  content: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s1,
  },
}));
