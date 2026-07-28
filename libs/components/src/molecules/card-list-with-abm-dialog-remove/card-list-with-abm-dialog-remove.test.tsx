jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

// Spy on Dialog while fully delegating to its real implementation — same technique used in
// card-list-with-abm-dialog-edit.test.tsx and the parent organism's own test, to inspect the
// exact `onClose` prop handed to the shared (non-owned) Dialog organism while `isSubmitting`.
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
import { CardListWithABMDialogRemove } from './card-list-with-abm-dialog-remove';

type DialogMockProps = { onClose?: () => void };
const DialogMock = Dialog as unknown as jest.Mock<ReactNode, [DialogMockProps]>;

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>First card content</Text>,
  accessibleLabel: 'First card',
  data: { note: 'first' },
};

const removingItem: CardListDialogState<StoryItem> = { type: 'remove', item };
const editingItem: CardListDialogState<StoryItem> = { type: 'edit', item };

/** Full context value with sensible test defaults; pass `overrides` per test. */
const makeContextValue = (
  overrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
): CardListWithABMDialogValue<StoryItem> => ({
  title: 'ignored here',
  items: [item],
  addButtonLabel: 'ignored here',
  onAddPress: jest.fn(),
  renderEditForm: () => null,
  editDialogTitle: 'ignored here',
  editSubmitLabel: 'ignored here',
  editCancelLabel: 'ignored here',
  onEditSubmit: jest.fn(),
  renderRemoveConfirmation: (i) => <Text>{`Remove ${i.data.note}?`}</Text>,
  removeDialogTitle: 'Remove card',
  removeSubmitLabel: 'Remove',
  removeCancelLabel: 'Keep it',
  onRemoveConfirm: jest.fn(),
  getEditAccessibilityLabel: () => 'ignored here',
  getRemoveAccessibilityLabel: () => 'ignored here',
  isSubmitting: false,
  ...overrides,
});

const renderRemove = (
  props: { open: boolean; dialogState: CardListDialogState<StoryItem>; onClose?: () => void },
  contextOverrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
) =>
  render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListWithABMDialogRemove {...props} />
    </CardListWithABMDialogProvider>,
  );

const mockUseLocalization = useLocalization as jest.Mock;

describe('CardListWithABMDialogRemove', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
  });

  it('renders nothing when closed', async () => {
    await renderRemove({ open: false, dialogState: null });

    expect(screen.queryByText('Remove card')).toBeNull();
  });

  it('renders the confirmation body and static chrome when open with a remove dialogState', async () => {
    await renderRemove({ open: true, dialogState: removingItem });

    expect(screen.getByText('Remove card')).toBeTruthy();
    expect(screen.getByText('Remove first?')).toBeTruthy();
    expect(screen.getByText('Remove')).toBeTruthy();
    expect(screen.getByText('Keep it')).toBeTruthy();
  });

  it('renders no body when open but dialogState is the edit type, not remove', async () => {
    await renderRemove({ open: true, dialogState: editingItem });

    expect(screen.getByText('Remove card')).toBeTruthy(); // static chrome still shows
    expect(screen.queryByText('Remove first?')).toBeNull();
  });

  it('replaces the confirmation with SubmittingIndicator and hides the action buttons while isSubmitting', async () => {
    await renderRemove({ open: true, dialogState: removingItem }, { isSubmitting: true });

    expect(screen.getByText('Remove card')).toBeTruthy(); // headline still shown
    expect(screen.queryByText('Remove first?')).toBeNull();
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Remove')).toBeNull();
    expect(screen.queryByText('Keep it')).toBeNull();
  });

  it('calls onRemoveConfirm with the item once, then closes, when Remove is pressed', async () => {
    const onRemoveConfirm = jest.fn();
    const onClose = jest.fn();
    await renderRemove({ open: true, dialogState: removingItem, onClose }, { onRemoveConfirm });

    fireEvent.press(screen.getByText('Remove'));

    expect(onRemoveConfirm).toHaveBeenCalledTimes(1);
    expect(onRemoveConfirm).toHaveBeenCalledWith(item);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes without calling onRemoveConfirm when Keep it is pressed', async () => {
    const onRemoveConfirm = jest.fn();
    const onClose = jest.fn();
    await renderRemove({ open: true, dialogState: removingItem, onClose }, { onRemoveConfirm });

    fireEvent.press(screen.getByText('Keep it'));

    expect(onRemoveConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Mutation coverage — the `dialogState?.type === 'remove'` guard inside handleRemoveConfirm
  // itself (distinct from the render guard above): confirming while dialogState is null must
  // still close, but must never call onRemoveConfirm with nothing to remove.
  it('closes without calling onRemoveConfirm when confirmed while dialogState is null', async () => {
    const onRemoveConfirm = jest.fn();
    const onClose = jest.fn();
    await renderRemove({ open: true, dialogState: null, onClose }, { onRemoveConfirm });

    fireEvent.press(screen.getByText('Remove'));

    expect(onRemoveConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The dialog must not be dismissible via scrim/Escape while isSubmitting (spec's Open
  // decisions) — asserted at the exact prop handoff to the shared Dialog organism, since actions
  // are hidden entirely in this state and there is no cancel button left to press.
  it('passes onClose as undefined to Dialog while isSubmitting, so it cannot be dismissed', async () => {
    const onClose = jest.fn();
    await renderRemove({ open: true, dialogState: removingItem, onClose }, { isSubmitting: true });

    const lastCall = DialogMock.mock.calls.at(-1);
    expect(lastCall?.[0].onClose).toBeUndefined();
  });

  it('passes the real onClose through to Dialog when not submitting', async () => {
    const onClose = jest.fn();
    await renderRemove({ open: true, dialogState: removingItem, onClose });

    const lastCall = DialogMock.mock.calls.at(-1);
    expect(lastCall?.[0].onClose).toBe(onClose);
  });
});
