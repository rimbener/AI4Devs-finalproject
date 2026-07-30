import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CardListWithABMDialogHeader } from '../../atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header';
import { CardListWithABMDialogDialog } from '../../molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog';
import { CardListWithABMDialogList } from '../card-list-with-abm-dialog-list/card-list-with-abm-dialog-list';
import type { CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import {
  CardListWithABMDialogProvider,
  useCardListWithABMDialogContext,
} from './hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from './hooks/card-list-with-abm-dialog.context.types';
import { useCardListWithABMDialog } from './hooks/use-card-list-with-abm-dialog';

/**
 * CardListWithABMDialog — titled `Card` list with an add button and, per item, optional
 * edit/remove icon affordances, each opening the shared `Dialog` organism (add-form /
 * edit-form / remove-confirmation). Open-dialog state lives in `use-card-list-with-abm-dialog.ts`
 * as a single discriminated union (spec.md's Open decisions) — only one dialog can be open at a
 * time by construction. While `isSubmitting` is true, the open dialog's body swaps entirely to
 * `SubmittingIndicator`, its cancel/submit buttons are hidden (`actions={<></>}`), and it can't
 * be dismissed via scrim/Escape (`onClose={undefined}`).
 */
export function CardListWithABMDialog<TItem>({
  style,
  cardStyle,
  cardListStyle,
  cardListContentContainerStyle,
  showAddButton,
  submitDisabled,
  errorMessage,
  onClose,
  ...props
}: CardListWithABMDialogValue<TItem> & CardListWithABMDialogProps) {
  return (
    <CardListWithABMDialogProvider value={props}>
      <CardListWithABMDialogWithContext
        errorMessage={errorMessage}
        showAddButton={showAddButton}
        submitDisabled={submitDisabled}
        style={style}
        cardStyle={cardStyle}
        cardListStyle={cardListStyle}
        cardListContentContainerStyle={cardListContentContainerStyle}
        onClose={onClose}
      />
    </CardListWithABMDialogProvider>
  );
}

function CardListWithABMDialogWithContext<TItem>({
  style,
  cardStyle,
  cardListStyle,
  errorMessage,
  showAddButton,
  submitDisabled,
  cardListContentContainerStyle,
  onClose,
}: CardListWithABMDialogProps) {
  const { items, emptyStateMessage, isSubmitting } = useCardListWithABMDialogContext<TItem>();

  const {
    dialogType,
    dialogItem,
    dialogState,
    openAddDialog,
    openEditDialog,
    openRemoveDialog,
    closeDialog,
    dialog,
  } = useCardListWithABMDialog<TItem>({
    initialDialogState: isSubmitting ? 'submitting' : 'closed',
  });

  const handleClose = () => {
    onClose?.();
    closeDialog();
  };

  return (
    <View style={[styles.root, style]}>
      <CardListWithABMDialogHeader showAddButton={showAddButton} onAddPress={openAddDialog} />
      {items.length === 0 ? (
        emptyStateMessage ? (
          <Text style={styles.emptyText}>{emptyStateMessage}</Text>
        ) : null
      ) : (
        <CardListWithABMDialogList
          cardStyle={cardStyle}
          cardListStyle={cardListStyle}
          cardListContentContainerStyle={cardListContentContainerStyle}
          openEditDialog={openEditDialog}
          openRemoveDialog={openRemoveDialog}
        />
      )}
      <CardListWithABMDialogDialog
        open={dialogState === 'open' || dialogState === 'submitting' || !!errorMessage}
        dialogType={dialogType}
        dialogState={dialogState}
        submitDisabled={submitDisabled}
        errorMessage={errorMessage}
        dialogItem={dialogItem}
        onClose={handleClose}
        onSubmit={dialog.onSubmit}
        title={dialog.title}
        submitLabel={dialog.submitLabel}
        cancelLabel={dialog.cancelLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    gap: theme.spacing.s4,
  },
  emptyText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
  },
}));
