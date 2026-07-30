import { render, renderHook, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CardListWithABMDialogProvider,
  useCardListWithABMDialogContext,
} from './card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from './card-list-with-abm-dialog.context.types';

type StoryItem = { note: string };

const baseValue: CardListWithABMDialogValue<StoryItem> = {
  title: 'My List',
  items: [],
  addButtonLabel: 'Add item',
  renderAddForm: () => <Text>Add form</Text>,
  addDialogTitle: 'Add card',
  renderEditForm: () => <Text>Edit form</Text>,
  editDialogTitle: 'Edit card',
  renderRemoveConfirmation: () => <Text>Remove confirmation</Text>,
  getEditAccessibilityLabel: () => 'Edit',
  getRemoveAccessibilityLabel: () => 'Remove',
  isSubmitting: false,
};

describe('useCardListWithABMDialogContext', () => {
  it('throws when used outside CardListWithABMDialogProvider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(renderHook(() => useCardListWithABMDialogContext<StoryItem>())).rejects.toThrow(
        'useCardListWithABMDialogContext must be used within CardListWithABMDialogProvider',
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('returns the provider value to consumers', async () => {
    const Consumer = () => {
      const { title, isSubmitting } = useCardListWithABMDialogContext<StoryItem>();
      return (
        <>
          <Text>{title}</Text>
          <Text>{isSubmitting ? 'submitting' : 'idle'}</Text>
        </>
      );
    };

    await render(
      <CardListWithABMDialogProvider value={baseValue}>
        <Consumer />
      </CardListWithABMDialogProvider>,
    );

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByText('idle')).toBeTruthy();
  });

  it('reflects the latest value on rerender', async () => {
    const Consumer = () => {
      const { title } = useCardListWithABMDialogContext<StoryItem>();
      return <Text>{title}</Text>;
    };

    const { rerender } = await render(
      <CardListWithABMDialogProvider value={baseValue}>
        <Consumer />
      </CardListWithABMDialogProvider>,
    );
    expect(screen.getByText('My List')).toBeTruthy();

    await rerender(
      <CardListWithABMDialogProvider value={{ ...baseValue, title: 'Updated List' }}>
        <Consumer />
      </CardListWithABMDialogProvider>,
    );

    expect(screen.queryByText('My List')).toBeNull();
    expect(screen.getByText('Updated List')).toBeTruthy();
  });
});
