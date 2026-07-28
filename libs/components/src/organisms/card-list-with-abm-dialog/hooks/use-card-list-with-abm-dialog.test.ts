import { act, renderHook } from '@testing-library/react-native';
import type { CardListItem } from '../card-list-with-abm-dialog.types';
import { useCardListWithABMDialog } from './use-card-list-with-abm-dialog';

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: null,
  accessibleLabel: 'First card',
  data: { note: 'first' },
};

const otherItem: CardListItem<StoryItem> = {
  id: 'item-2',
  content: null,
  accessibleLabel: 'Second card',
  data: { note: 'second' },
};

describe('useCardListWithABMDialog', () => {
  it('starts with no dialog open', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    expect(result.current?.dialogState).toBeNull();
    expect(result.current?.isOpen).toBe(false);
  });

  it('openEditDialog sets dialogState to the edit type for that item and opens it', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openEditDialog(item);
    });

    expect(result.current?.dialogState).toEqual({ type: 'edit', item });
    expect(result.current?.isOpen).toBe(true);
  });

  it('openRemoveDialog sets dialogState to the remove type for that item and opens it', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });

    expect(result.current?.dialogState).toEqual({ type: 'remove', item });
    expect(result.current?.isOpen).toBe(true);
  });

  // @s19 — closing the edit dialog flips isOpen false without clearing dialogState, so the
  // last {type, item} stays available for the remainder of the shared Dialog's close
  // transition (spec.md's post-pr_ready bug-fix decision).
  it('closeDialog flips isOpen to false but keeps the last dialogState (edit)', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.isOpen).toBe(false);
    expect(result.current?.dialogState).toEqual({ type: 'edit', item });
  });

  // @s20 — same guarantee for the remove dialog.
  it('closeDialog flips isOpen to false but keeps the last dialogState (remove)', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.isOpen).toBe(false);
    expect(result.current?.dialogState).toEqual({ type: 'remove', item });
  });

  it('opening a dialog after closing one replaces the stale dialogState', async () => {
    const { result } = await renderHook(() => useCardListWithABMDialog<StoryItem>());

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });
    await act(async () => {
      result.current?.openEditDialog(otherItem);
    });

    expect(result.current?.isOpen).toBe(true);
    expect(result.current?.dialogState).toEqual({ type: 'edit', item: otherItem });
  });
});
