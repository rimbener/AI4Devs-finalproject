import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useCardListWithABMDialogContext } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { Button } from '../button/button';

export const CardListWithABMDialogHeader = <TItem,>() => {
  const { title, addButtonLabel, onAddPress } = useCardListWithABMDialogContext<TItem>();
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Button icon="add" onPress={onAddPress} accessibilityLabel={addButtonLabel}>
        {addButtonLabel}
      </Button>
    </View>
  );
};

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
