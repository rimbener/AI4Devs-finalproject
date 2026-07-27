import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '../../atoms/card/card';
import { IconButton } from '../../atoms/icon-button/icon-button';
import { layout } from '../../theme/spacing';
import type { CardListRowProps } from './card-list-row.types';

/** testID for a row's `Card` wrapper (its opacity carries the disabled visual, @s2). */
export const cardListItemCardTestId = (id: string) => `card-list-with-abm-dialog-card-${id}`;
/** testID prefix for a row's edit icon. */
export const cardListItemEditTestId = (id: string) => `card-list-with-abm-dialog-edit-${id}`;
/** testID prefix for a row's remove icon. */
export const cardListItemRemoveTestId = (id: string) => `card-list-with-abm-dialog-remove-${id}`;

/**
 * CardListRow — one `CardListWithABMDialog` row: `Card` wrapping the caller's content plus
 * optional edit/remove icons. Icons are wrapped in a local testID `View` rather than the shared
 * `IconButton` atom gaining a `testID` prop (atom-ban).
 * Each icon's accessible name is built per-action by the caller-supplied
 * `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` props (WCAG 4.1.2 — `IconButton`
 * always renders `accessibilityRole="button"`, so an accessible name must not be missing).
 * Memoized — keeps per-cell handlers stable across parent `FlatList` re-renders
 * (full-review minor [perf]; mirrors `pdf-document-list.tsx`'s `PdfDocumentListRow`).
 */
export const CardListRow = memo(function CardListRow<TItem>({
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
