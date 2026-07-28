jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

// Spy on Dialog while fully delegating to its real implementation (no behavior change — every
// other test in this file still exercises the real Dialog/Modal gating). This is the only way to
// inspect the exact `onClose` prop CardListWithABMDialogEdit hands the shared (non-owned) Dialog
// organism while `isSubmitting` is true, without editing or replacing Dialog/Modal itself — same
// technique the parent organism's own test file uses for its Dialog-prop assertions.
jest.mock('../../organisms/dialog/dialog', () => {
  const actual = jest.requireActual('../../organisms/dialog/dialog');
  return {
    ...actual,
    Dialog: jest.fn(actual.Dialog),
  };
});

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import type {
  CardListDialogState,
  CardListItem,
} from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import {
  CardListWithABMDialogProvider,
  type CardListWithABMDialogValue,
} from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { Dialog } from '../../organisms/dialog/dialog';
import { CardListWithABMDialogEdit } from './card-list-with-abm-dialog-edit';

type DialogMockProps = { onClose?: () => void };
const DialogMock = Dialog as unknown as jest.Mock<ReactNode, [DialogMockProps]>;

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>First card content</Text>,
  accessibleLabel: 'First card',
  data: { note: 'first' },
};

const editingItem: CardListDialogState<StoryItem> = { type: 'edit', item };
const removingItem: CardListDialogState<StoryItem> = { type: 'remove', item };

/** Full context value with sensible test defaults; pass `overrides` per test. */
const makeContextValue = (
  overrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
): CardListWithABMDialogValue<StoryItem> => ({
  title: 'ignored here',
  items: [item],
  addButtonLabel: 'ignored here',
  onAddPress: jest.fn(),
  renderEditForm: (i) => <Text>{`Edit form for ${i.data.note}`}</Text>,
  editDialogTitle: 'Edit card',
  editSubmitLabel: 'Save',
  editCancelLabel: 'Cancel',
  onEditSubmit: jest.fn(),
  renderRemoveConfirmation: () => null,
  removeDialogTitle: 'ignored here',
  removeSubmitLabel: 'ignored here',
  removeCancelLabel: 'ignored here',
  onRemoveConfirm: jest.fn(),
  getEditAccessibilityLabel: () => 'ignored here',
  getRemoveAccessibilityLabel: () => 'ignored here',
  isSubmitting: false,
  ...overrides,
});

const renderEdit = (
  props: { open: boolean; dialogState: CardListDialogState<StoryItem>; onClose?: () => void },
  contextOverrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
) =>
  render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListWithABMDialogEdit {...props} />
    </CardListWithABMDialogProvider>,
  );

const mockUseLocalization = useLocalization as jest.Mock;

describe('CardListWithABMDialogEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
  });

  it('renders nothing when closed', async () => {
    await renderEdit({ open: false, dialogState: null });

    expect(screen.queryByText('Edit card')).toBeNull();
  });

  it('renders the edit form and static chrome when open with an edit dialogState', async () => {
    await renderEdit({ open: true, dialogState: editingItem });

    expect(screen.getByText('Edit card')).toBeTruthy();
    expect(screen.getByText('Edit form for first')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('renders no body when open but dialogState is the remove type, not edit', async () => {
    await renderEdit({ open: true, dialogState: removingItem });

    expect(screen.getByText('Edit card')).toBeTruthy(); // static chrome still shows
    expect(screen.queryByText('Edit form for first')).toBeNull();
  });

  it('replaces the form with SubmittingIndicator and hides the action buttons while isSubmitting', async () => {
    await renderEdit({ open: true, dialogState: editingItem }, { isSubmitting: true });

    expect(screen.getByText('Edit card')).toBeTruthy(); // headline still shown
    expect(screen.queryByText('Edit form for first')).toBeNull();
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('calls onEditSubmit with the item once, then closes, when Save is pressed', async () => {
    const onEditSubmit = jest.fn();
    const onClose = jest.fn();
    await renderEdit({ open: true, dialogState: editingItem, onClose }, { onEditSubmit });

    fireEvent.press(screen.getByText('Save'));

    expect(onEditSubmit).toHaveBeenCalledTimes(1);
    expect(onEditSubmit).toHaveBeenCalledWith(item);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes without calling onEditSubmit when Cancel is pressed', async () => {
    const onEditSubmit = jest.fn();
    const onClose = jest.fn();
    await renderEdit({ open: true, dialogState: editingItem, onClose }, { onEditSubmit });

    fireEvent.press(screen.getByText('Cancel'));

    expect(onEditSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Mutation coverage — the `dialogState?.type === 'edit'` guard inside handleEditConfirm itself
  // (distinct from the render guard above): confirming while dialogState is null must still
  // close, but must never call onEditSubmit with nothing to submit.
  it('closes without calling onEditSubmit when confirmed while dialogState is null', async () => {
    const onEditSubmit = jest.fn();
    const onClose = jest.fn();
    await renderEdit({ open: true, dialogState: null, onClose }, { onEditSubmit });

    fireEvent.press(screen.getByText('Save'));

    expect(onEditSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The dialog must not be dismissible via scrim/Escape while isSubmitting (spec's Open
  // decisions) — asserted at the exact prop handoff to the shared Dialog organism, since actions
  // are hidden entirely in this state and there is no cancel button left to press.
  it('passes onClose as undefined to Dialog while isSubmitting, so it cannot be dismissed', async () => {
    const onClose = jest.fn();
    await renderEdit({ open: true, dialogState: editingItem, onClose }, { isSubmitting: true });

    const lastCall = DialogMock.mock.calls.at(-1);
    expect(lastCall?.[0].onClose).toBeUndefined();
  });

  it('passes the real onClose through to Dialog when not submitting', async () => {
    const onClose = jest.fn();
    await renderEdit({ open: true, dialogState: editingItem, onClose });

    const lastCall = DialogMock.mock.calls.at(-1);
    expect(lastCall?.[0].onClose).toBe(onClose);
  });
});
