import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../atoms/button/button';
import { Card } from '../../atoms/card/card';
import { IconButton } from '../../atoms/icon-button/icon-button';
import { SubmittingIndicator } from '../../molecules/submitting-indicator/submitting-indicator';
import { layout } from '../../theme/spacing';
import { Dialog } from '../dialog/dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import { useCardListWithABMDialog } from './use-card-list-with-abm-dialog';

/** testID for the virtualized content list. */
export const CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID = 'card-list-with-abm-dialog-list';

// Truthy-but-empty: overrides Dialog's `actions ?? (<default buttons>)` fallback
// (`undefined`/`null` would fall through to it) to hide the cancel/submit row while
// isSubmitting is true.
const EMPTY_DIALOG_ACTIONS = <></>;

/** testID for a row's `Card` wrapper (its opacity carries the disabled visual, @s2). */
export const cardListItemCardTestId = (id: string) => `card-list-with-abm-dialog-card-${id}`;
/** testID prefix for a row's edit icon. */
export const cardListItemEditTestId = (id: string) => `card-list-with-abm-dialog-edit-${id}`;
/** testID prefix for a row's remove icon. */
export const cardListItemRemoveTestId = (id: string) => `card-list-with-abm-dialog-remove-${id}`;

type CardListRowProps<TItem> = {
  item: CardListItem<TItem>;
  onEditPress: (item: CardListItem<TItem>) => void;
  onRemovePress: (item: CardListItem<TItem>) => void;
  getEditAccessibilityLabel: (item: CardListItem<TItem>) => string;
  getRemoveAccessibilityLabel: (item: CardListItem<TItem>) => string;
};

/**
 * CardListWithABMDialog — titled `Card` list with an add button and, per item, optional
 * edit/remove icon affordances, each opening the shared `Dialog` organism (edit-form /
 * remove-confirmation). Open-dialog state lives in `use-card-list-with-abm-dialog.ts` as a
 * single discriminated union (spec.md's Open decisions) — only one dialog can be open at a
 * time by construction. While `isSubmitting` is true, the open dialog's body swaps entirely to
 * `SubmittingIndicator`, its cancel/submit buttons are hidden (`actions={<></>}`), and it can't
 * be dismissed via scrim/Escape (`onClose={undefined}`).
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
  getEditAccessibilityLabel,
  getRemoveAccessibilityLabel,
  isSubmitting,
}: CardListWithABMDialogProps<TItem>) => {
  const { dialogState, openEditDialog, openRemoveDialog, closeDialog } =
    useCardListWithABMDialog<TItem>();

  const keyExtractor = useCallback(
    (item: CardListItem<TItem>) => item.id,
    // Stryker disable next-line ArrayDeclaration: keyExtractor closes over nothing but its own
    // `item` param — the (unused) dependency array can never observably change its behavior
    // (mirrors pdf-document-list.tsx's identical keyExtractor equivalent).
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: CardListItem<TItem> }) => (
      <CardListRow
        item={item}
        onEditPress={openEditDialog}
        onRemovePress={openRemoveDialog}
        getEditAccessibilityLabel={getEditAccessibilityLabel}
        getRemoveAccessibilityLabel={getRemoveAccessibilityLabel}
      />
    ),
    [openEditDialog, openRemoveDialog, getEditAccessibilityLabel, getRemoveAccessibilityLabel],
  );

  const handleEditConfirm = () => {
    // Stryker disable next-line OptionalChaining: dialogState is never null in any reachable
    // call — this Dialog's own onConfirm (the Save button) only exists in the render tree
    // while `open`, i.e. while `dialogState?.type === 'edit'` is already true (Modal renders no
    // children while `visible={false}`) — so dropping `?.` can never observably differ. The
    // ConditionalExpression `true` mutant on the same line is a separate, documented equivalent
    // (see mutation.md) — NOT disabled here, since the `false` mutant on this same condition
    // must stay tracked as Killed by the existing onEditSubmit-called-once assertion.
    if (dialogState?.type === 'edit') {
      onEditSubmit(dialogState.item);
    }
    closeDialog();
  };

  const handleRemoveConfirm = () => {
    // Stryker disable next-line OptionalChaining: same equivalence as handleEditConfirm above.
    if (dialogState?.type === 'remove') {
      onRemoveConfirm(dialogState.item);
    }
    closeDialog();
  };

  // Shared isSubmitting-swap: while submitting, the open dialog can't be dismissed and hides
  // its own cancel/submit row (`EMPTY_DIALOG_ACTIONS`); reused by both Dialog blocks below.
  const dialogInteractionProps = isSubmitting
    ? { onClose: undefined, actions: EMPTY_DIALOG_ACTIONS }
    : { onClose: closeDialog, actions: undefined };

  // Shared isSubmitting-swap for the dialog body: while submitting, show SubmittingIndicator
  // instead of the caller-supplied content; reused by both Dialog blocks below.
  const renderDialogBody = (
    type: 'edit' | 'remove',
    render: (item: CardListItem<TItem>) => ReactNode,
  ): ReactNode => {
    if (dialogState?.type !== type) return null;
    return isSubmitting ? <SubmittingIndicator /> : render(dialogState.item);
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
        {...dialogInteractionProps}
        headline={editDialogTitle}
        confirmLabel={editSubmitLabel}
        cancelLabel={editCancelLabel}
        onConfirm={handleEditConfirm}
      >
        {renderDialogBody('edit', renderEditForm)}
      </Dialog>
      <Dialog
        open={dialogState?.type === 'remove'}
        {...dialogInteractionProps}
        headline={removeDialogTitle}
        confirmLabel={removeSubmitLabel}
        cancelLabel={removeCancelLabel}
        onConfirm={handleRemoveConfirm}
      >
        {renderDialogBody('remove', renderRemoveConfirmation)}
      </Dialog>
    </View>
  );
};

/**
 * One row: `Card` wrapping the caller's content plus optional edit/remove icons.
 * Icons are wrapped in a local testID `View` rather than the shared `IconButton` atom
 * gaining a `testID` prop (atom-ban).
 * Each icon's accessible name is built per-action by the caller-supplied
 * `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` props (WCAG 4.1.2 — `IconButton`
 * always renders `accessibilityRole="button"`, so an accessible name must not be missing).
 * Memoized — keeps per-cell handlers stable across parent `FlatList` re-renders
 * (full-review minor [perf]; mirrors `pdf-document-list.tsx`'s `PdfDocumentListRow`).
 */
const CardListRow = memo(function CardListRow<TItem>({
  item,
  onEditPress,
  onRemovePress,
  getEditAccessibilityLabel,
  getRemoveAccessibilityLabel,
}: CardListRowProps<TItem>) {
  const handleEditPress = useCallback(() => onEditPress(item), [onEditPress, item]);
  const handleRemovePress = useCallback(() => onRemovePress(item), [onRemovePress, item]);

  return (
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
                accessibilityLabel={getEditAccessibilityLabel(item)}
                onPress={handleEditPress}
              />
            </View>
          ) : null}
          {item.showRemoveButton ? (
            <View testID={cardListItemRemoveTestId(item.id)}>
              <IconButton
                icon="delete"
                size={layout.touchTarget}
                disabled={item.disabled}
                accessibilityLabel={getRemoveAccessibilityLabel(item)}
                onPress={handleRemovePress}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}) as <TItem>(props: CardListRowProps<TItem>) => ReactNode;

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
