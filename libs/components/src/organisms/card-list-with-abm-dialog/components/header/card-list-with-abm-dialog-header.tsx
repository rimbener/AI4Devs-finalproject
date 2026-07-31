import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../../../atoms/button/button';
import { useCardListWithABMDialogContext } from '../../hooks/card-list-with-abm-dialog.context';

type CardListWithABMDialogHeaderProps = {
  showAddButton?: boolean;
  onAddPress?: () => void;
};

export function CardListWithABMDialogHeader<TItem>({
  showAddButton,
  onAddPress,
}: CardListWithABMDialogHeaderProps) {
  const { title, addButtonLabel } = useCardListWithABMDialogContext<TItem>();
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {showAddButton && onAddPress ? (
        <Button icon="add" onPress={onAddPress} accessibilityLabel={addButtonLabel}>
          {addButtonLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
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
}));
