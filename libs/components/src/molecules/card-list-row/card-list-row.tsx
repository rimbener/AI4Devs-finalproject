import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '../../atoms/card/card';
import { IconButton } from '../../atoms/icon-button/icon-button';
import { layout } from '../../theme/spacing';
import type { CardListRowProps } from './card-list-row.types';

/**
 * CardListRow — a portable card-list row: `Card` wrapping the caller's content plus optional
 * edit/remove icon affordances. Fully organism-agnostic (see `card-list-row.types.ts`) — any
 * caller resolves its own accessible names, press handlers, and testIDs. Icons are wrapped in a
 * local testID `View` rather than the shared `IconButton` atom gaining a `testID` prop
 * (atom-ban). Each icon's accessible name comes from the caller-resolved
 * `editAccessibilityLabel`/`removeAccessibilityLabel` props (WCAG 4.1.2 — `IconButton` always
 * renders `accessibilityRole="button"`, so an accessible name must not be missing).
 * Memoized — keeps per-cell renders cheap when a caller reuses this row inside a virtualized
 * list (full-review minor [perf]; mirrors `pdf-document-list.tsx`'s `PdfDocumentListRow`).
 */
export const CardListRow = memo(function CardListRow({
  style,
  content,
  disabled,
  showEditButton,
  showRemoveButton,
  onEditPress,
  onRemovePress,
  editAccessibilityLabel,
  removeAccessibilityLabel,
  testID,
  editTestID,
  removeTestID,
}: CardListRowProps) {
  return (
    <Card testID={testID} style={[disabled ? styles.disabledCard : undefined, style]}>
      <View style={styles.row}>
        {content ? <View style={styles.content}>{content}</View> : null}
        <View style={styles.actions}>
          {showEditButton ? (
            <View testID={editTestID}>
              <IconButton
                icon="edit"
                size={layout.touchTarget}
                disabled={disabled}
                accessibilityLabel={editAccessibilityLabel}
                onPress={onEditPress}
              />
            </View>
          ) : null}
          {showRemoveButton ? (
            <View testID={removeTestID}>
              <IconButton
                icon="delete"
                size={layout.touchTarget}
                disabled={disabled}
                accessibilityLabel={removeAccessibilityLabel}
                onPress={onRemovePress}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
});

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
