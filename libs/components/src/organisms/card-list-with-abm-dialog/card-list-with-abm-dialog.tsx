import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { CardListWithABMDialogHeader } from '../../atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header';
import { CardListWithABMDialogEdit } from '../../molecules/card-list-with-abm-dialog-edit/card-list-with-abm-dialog-edit';
import { CardListWithABMDialogRemove } from '../../molecules/card-list-with-abm-dialog-remove/card-list-with-abm-dialog-remove';
import { CardListWithABMDialogList } from '../card-list-with-abm-dialog-list/card-list-with-abm-dialog-list';
import type { CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import {
  CardListWithABMDialogProvider,
  useCardListWithABMDialogContext,
} from './hooks/card-list-with-abm-dialog.context';
import { useCardListWithABMDialog } from './hooks/use-card-list-with-abm-dialog';

/**
 * CardListWithABMDialog — titled `Card` list with an add button and, per item, optional
 * edit/remove icon affordances, each opening the shared `Dialog` organism (edit-form /
 * remove-confirmation). Open-dialog state lives in `use-card-list-with-abm-dialog.ts` as a
 * single discriminated union (spec.md's Open decisions) — only one dialog can be open at a
 * time by construction. While `isSubmitting` is true, the open dialog's body swaps entirely to
 * `SubmittingIndicator`, its cancel/submit buttons are hidden (`actions={<></>}`), and it can't
 * be dismissed via scrim/Escape (`onClose={undefined}`).
 */
export function CardListWithABMDialog<TItem>(props: CardListWithABMDialogProps<TItem>) {
  return (
    <CardListWithABMDialogProvider value={props}>
      <CardListWithABMDialogWithContext />
    </CardListWithABMDialogProvider>
  );
}

function CardListWithABMDialogWithContext<TItem>() {
  const { items, emptyStateMessage } = useCardListWithABMDialogContext<TItem>();
  const { dialogState, isOpen, openEditDialog, openRemoveDialog, closeDialog } =
    useCardListWithABMDialog<TItem>();

  return (
    <View style={styles.root}>
      <CardListWithABMDialogHeader />
      {items.length === 0 ? (
        emptyStateMessage ? (
          <Text style={styles.emptyText}>{emptyStateMessage}</Text>
        ) : null
      ) : (
        <CardListWithABMDialogList
          openEditDialog={openEditDialog}
          openRemoveDialog={openRemoveDialog}
        />
      )}
      <CardListWithABMDialogEdit
        open={isOpen && dialogState?.type === 'edit'}
        dialogState={dialogState}
        onClose={closeDialog}
      />
      <CardListWithABMDialogRemove
        open={isOpen && dialogState?.type === 'remove'}
        dialogState={dialogState}
        onClose={closeDialog}
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
