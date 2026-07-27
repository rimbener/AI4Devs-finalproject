import { act, renderHook } from '@testing-library/react-native';
import type { CardListItem } from './card-list-with-abm-dialog.types';
import { useCardListWithABMDialog } from './use-card-list-with-abm-dialog';

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: null,
  accessibleLabel: 'First card',
  data: { note: 'first' },
};

describe('useCardListWithABMDialog', () => {
  it('starts with no dialog open', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    expect(result.current?.dialogState).toBeNull();
  });

  it('openEditDialog sets dialogState to the edit type for that item', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openEditDialog(item);
    });

    expect(result.current?.dialogState).toEqual({ type: 'edit', item });
  });

  it('openRemoveDialog sets dialogState to the remove type for that item', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });

    expect(result.current?.dialogState).toEqual({ type: 'remove', item });
  });

  it('closeDialog clears dialogState back to null', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBeNull();
  });
});
