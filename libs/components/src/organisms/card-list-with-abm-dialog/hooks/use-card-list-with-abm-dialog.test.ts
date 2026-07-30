import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { CardListItem } from '../card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from './card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from './card-list-with-abm-dialog.context.types';
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

const contextValue: CardListWithABMDialogValue<StoryItem> = {
  title: 'Cards',
  items: [],
  addButtonLabel: 'Add item',
  renderAddForm: () => null,
  addDialogTitle: 'Add card',
  renderEditForm: () => null,
  editDialogTitle: 'Edit card',
  renderRemoveConfirmation: () => null,
  getEditAccessibilityLabel: () => 'Edit',
  getRemoveAccessibilityLabel: () => 'Remove',
  isSubmitting: false,
};

const wrapper = ({ children }: { children: ReactNode }) =>
  CardListWithABMDialogProvider<StoryItem>({ value: contextValue, children });

describe('useCardListWithABMDialog', () => {
  it('starts closed with no dialog type or item', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBeNull();
    expect(result.current?.dialogItem).toBeNull();
  });

  it('openAddDialog sets dialogType to add and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });

    expect(result.current?.dialogType).toBe('add');
    expect(result.current?.dialogItem).toBeNull();
    expect(result.current?.dialogState).toBe('open');
  });

  it('openEditDialog sets dialogType to edit for that item and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });

    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(item);
    expect(result.current?.dialogState).toBe('open');
  });

  it('openRemoveDialog sets dialogType to remove for that item and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });

    expect(result.current?.dialogType).toBe('remove');
    expect(result.current?.dialogItem).toEqual(item);
    expect(result.current?.dialogState).toBe('open');
  });

  // Same close-without-clear guarantee as @s19/@s20, for the add dialog.
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (add)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('add');
    expect(result.current?.dialogItem).toBeNull();
  });

  // @s19 — closing the edit dialog flips dialogState to closed without clearing dialogType/
  // dialogItem, so the last {type, item} stays available for the remainder of the shared
  // Dialog's close transition (spec.md's post-pr_ready bug-fix decision).
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (edit)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(item);
  });

  // @s20 — same guarantee for the remove dialog.
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (remove)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('remove');
    expect(result.current?.dialogItem).toEqual(item);
  });

  it('opening a dialog after closing one replaces the stale dialogType/dialogItem', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });
    await act(async () => {
      result.current?.openEditDialog(otherItem);
    });

    expect(result.current?.dialogState).toBe('open');
    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(otherItem);
  });
});
