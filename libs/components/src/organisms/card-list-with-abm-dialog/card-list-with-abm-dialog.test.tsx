// SubmittingIndicator (rendered while isSubmitting) calls useLocalization — mock it as the
// rest of this lib's dialog tests do (e.g. api-key-form-dialog.test.tsx).
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

// @s19/@s20 — spy on Dialog while fully delegating to its real implementation (no behavior
// change: every other test in this file still exercises the real Dialog/Modal gating). This
// lets us inspect the exact `open`/`children` props CardListWithABMDialog hands the shared
// (non-owned, atom-ban) Dialog organism at the moment `closeDialog` runs — the actual bug-fix
// locus — without editing or replacing Dialog/Modal itself.
jest.mock('../dialog/dialog', () => {
  const actual = jest.requireActual('../dialog/dialog');
  return {
    ...actual,
    Dialog: jest.fn(actual.Dialog),
  };
});

import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { Dialog } from '../dialog/dialog';
import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  CardListWithABMDialog,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-with-abm-dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';

type DialogMockProps = { open: boolean; headline?: string; children: ReactNode };
const DialogMock = Dialog as unknown as jest.Mock<ReactNode, [DialogMockProps]>;
const lastCallFor = (headline: string): DialogMockProps => {
  const calls = DialogMock.mock.calls.filter(([props]) => props.headline === headline);
  const lastCall = calls.at(-1);
  if (!lastCall) throw new Error(`no Dialog render captured for headline "${headline}"`);
  return lastCall[0];
};
// Reads the plain-string body a renderEditForm/renderRemoveConfirmation `<Text>` element
// carries. Deliberately shallow (not a deep `toEqual` of the whole React element): React
// elements can carry dev-only internals (e.g. class-component instance getters) whose deep
// traversal recurses pathologically in Jest's equality algorithm — comparing the actual
// rendered content is both the real assertion and the safe one.
const bodyText = (node: ReactNode): string => {
  const element = node as { props?: { children?: unknown } } | null;
  return String(element?.props?.children ?? '');
};

type StoryItem = { note: string };

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const items: CardListItem<StoryItem>[] = [
  {
    id: 'item-1',
    content: <Text>First card content</Text>,
    accessibleLabel: 'First card',
    showEditButton: true,
    showRemoveButton: true,
    data: { note: 'first' },
  },
  {
    id: 'item-2',
    content: <Text>Second card content</Text>,
    accessibleLabel: 'Second card',
    showEditButton: true,
    showRemoveButton: true,
    data: { note: 'second' },
  },
];

/** Full required prop surface with sensible test defaults; pass `overrides` per test. */
const makeProps = (
  overrides: Partial<CardListWithABMDialogProps<StoryItem>> = {},
): CardListWithABMDialogProps<StoryItem> => ({
  title: 'My List',
  items,
  addButtonLabel: 'Add item',
  onAddPress: jest.fn(),
  renderEditForm: (item) => <Text>{`Edit form for ${item.id}`}</Text>,
  editDialogTitle: 'Edit card',
  editSubmitLabel: 'Save',
  editCancelLabel: 'Cancel',
  onEditSubmit: jest.fn(),
  renderRemoveConfirmation: (item) => <Text>{`Remove ${item.id}?`}</Text>,
  removeDialogTitle: 'Remove card',
  removeSubmitLabel: 'Remove',
  removeCancelLabel: 'Keep it',
  onRemoveConfirm: jest.fn(),
  getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
  isSubmitting: false,
  ...overrides,
});

const mockUseLocalization = useLocalization as jest.Mock;

describe('CardListWithABMDialog', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
    // Keeps the Dialog spy's recorded call history scoped to one test at a time — this suite
    // renders/re-renders Dialog many times per test, and leaving decades of prior renders'
    // full props (nested element trees) accumulated across every test in this file is what
    // blows the worker's heap, not anything under test.
    DialogMock.mockClear();
  });

  // @s1 — populated list renders title, add button, and each item's content.
  it('renders the title, an Add button, and one Card per item', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.getByRole('header', { name: 'My List' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.getByText('First card content')).toBeTruthy();
    expect(screen.getByText('Second card content')).toBeTruthy();
    expect(screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeTruthy();
  });

  // [a11y] title is exposed as a navigable heading (WCAG reading/heading-navigation order).
  it('exposes the title with accessibilityRole="header"', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.getByRole('header', { name: 'My List' })).toBeTruthy();
  });

  // @s14 — per-card icon buttons have card-specific accessible names built by the caller's
  // getEditAccessibilityLabel/getRemoveAccessibilityLabel props (WCAG 4.1.2: name must exist).
  it('builds each edit/remove icon accessible name from get*AccessibilityLabel(item), distinct per card', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const editButton1 = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    const removeButton1 = within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole(
      'button',
    );
    const editButton2 = within(screen.getByTestId(cardListItemEditTestId('item-2'))).getByRole(
      'button',
    );
    const removeButton2 = within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole(
      'button',
    );

    expect(editButton1.props.accessibilityLabel).toBe('Edit First card');
    expect(removeButton1.props.accessibilityLabel).toBe('Remove First card');
    expect(editButton2.props.accessibilityLabel).toBe('Edit Second card');
    expect(removeButton2.props.accessibilityLabel).toBe('Remove Second card');

    expect(editButton1.props.accessibilityLabel).not.toBe(editButton2.props.accessibilityLabel);
    expect(removeButton1.props.accessibilityLabel).not.toBe(removeButton2.props.accessibilityLabel);
  });

  it('extracts each item id as the FlatList key', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(list.props.keyExtractor(items[0])).toBe('item-1');
    expect(list.props.keyExtractor(items[1])).toBe('item-2');
  });

  // @s2 — disabled item renders at reduced opacity with both icons disabled.
  it('renders a disabled item at theme.disabledOpacity with disabled edit/remove icons', async () => {
    await render(
      <CardListWithABMDialog {...makeProps({ items: [{ ...items[0]!, disabled: true }] })} />,
    );

    const card = screen.getByTestId(cardListItemCardTestId('item-1'));
    expect(flattenStyle(card.props.style).opacity).toBe(0.38);

    const editButton = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    const removeButton = within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole(
      'button',
    );
    expect(editButton.props.accessibilityState?.disabled).toBe(true);
    expect(removeButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('does not reduce opacity or disable icons for a non-disabled item', async () => {
    await render(<CardListWithABMDialog {...makeProps({ items: [items[0]!] })} />);

    const card = screen.getByTestId(cardListItemCardTestId('item-1'));
    expect(flattenStyle(card.props.style).opacity).toBeUndefined();

    const editButton = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    expect(editButton.props.accessibilityState?.disabled).toBe(false);
  });

  // @s3 — showEditButton: false hides only the edit icon.
  it('hides only the edit icon when showEditButton is false', async () => {
    await render(
      <CardListWithABMDialog
        {...makeProps({
          items: [{ ...items[0]!, showEditButton: false, showRemoveButton: true }],
        })}
      />,
    );

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.getByTestId(cardListItemRemoveTestId('item-1'))).toBeTruthy();
  });

  // @s4 — showRemoveButton: false hides only the remove icon.
  it('hides only the remove icon when showRemoveButton is false', async () => {
    await render(
      <CardListWithABMDialog
        {...makeProps({
          items: [{ ...items[0]!, showEditButton: true, showRemoveButton: false }],
        })}
      />,
    );

    expect(screen.getByTestId(cardListItemEditTestId('item-1'))).toBeTruthy();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  it('renders neither edit nor remove icon when both flags are omitted', async () => {
    await render(
      <CardListWithABMDialog
        {...makeProps({
          items: [{ ...items[0]!, showEditButton: undefined, showRemoveButton: undefined }],
        })}
      />,
    );

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  // @s15 — empty list with emptyStateMessage.
  it('renders the title, add button, and emptyStateMessage when items is empty and message is set', async () => {
    await render(
      <CardListWithABMDialog
        {...makeProps({ items: [], emptyStateMessage: 'Nothing here yet' })}
      />,
    );

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(screen.queryByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeNull();
  });

  // @s16 — empty list without emptyStateMessage.
  it('renders the title and add button but nothing else when items is empty and no message is set', async () => {
    await render(<CardListWithABMDialog {...makeProps({ items: [] })} />);

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.queryByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeNull();
  });

  // @s17 — tapping the add button notifies the caller.
  it('calls onAddPress once when the add button is pressed', async () => {
    const onAddPress = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onAddPress })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  it('calls onAddPress once from the empty state too', async () => {
    const onAddPress = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ items: [], onAddPress })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  // @s5 — edit icon opens the edit dialog with that item's content and static chrome.
  it('opens the edit dialog with renderEditForm(item) and the static edit chrome', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.queryByText('Edit card')).toBeNull();

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });

    expect(screen.getByText('Edit card')).toBeTruthy();
    expect(screen.getByText('Edit form for item-1')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    // Only the tapped item's form renders, not the other item's.
    expect(screen.queryByText('Edit form for item-2')).toBeNull();
  });

  // @s6 — remove icon opens the remove-confirmation dialog with that item's content and chrome.
  it('opens the remove dialog with renderRemoveConfirmation(item) and the static remove chrome', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.queryByText('Remove card')).toBeNull();

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
      );
    });

    expect(screen.getByText('Remove card')).toBeTruthy();
    expect(screen.getByText('Remove item-2?')).toBeTruthy();
    expect(screen.getByText('Remove')).toBeTruthy();
    expect(screen.getByText('Keep it')).toBeTruthy();
  });

  // @s7 — submitting the edit dialog notifies onEditSubmit with the item, then closes.
  it('calls onEditSubmit with the item once its dialog is submitted, then closes it', async () => {
    const onEditSubmit = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onEditSubmit })} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-2'))).getByRole('button'),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });

    expect(onEditSubmit).toHaveBeenCalledTimes(1);
    expect(onEditSubmit).toHaveBeenCalledWith(items[1]);
    expect(screen.queryByText('Edit card')).toBeNull();
  });

  // @s8 — submitting the remove dialog notifies onRemoveConfirm with the item, then closes.
  it('calls onRemoveConfirm with the item once its dialog is submitted, then closes it', async () => {
    const onRemoveConfirm = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onRemoveConfirm })} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole('button'),
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Remove'));
    });

    expect(onRemoveConfirm).toHaveBeenCalledTimes(1);
    expect(onRemoveConfirm).toHaveBeenCalledWith(items[0]);
    expect(screen.queryByText('Remove card')).toBeNull();
  });

  // @s9 — canceling the edit dialog closes it without submitting.
  it('closes the edit dialog without calling onEditSubmit when Cancel is pressed', async () => {
    const onEditSubmit = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onEditSubmit })} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(screen.getByText('Edit card')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });

    expect(onEditSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText('Edit card')).toBeNull();
  });

  // @s10 — canceling the remove dialog closes it without submitting.
  it('closes the remove dialog without calling onRemoveConfirm when Cancel is pressed', async () => {
    const onRemoveConfirm = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onRemoveConfirm })} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole('button'),
      );
    });
    expect(screen.getByText('Remove card')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Keep it'));
    });

    expect(onRemoveConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('Remove card')).toBeNull();
  });

  // @s19 — post-pr_ready bug fix: closing the edit dialog must not flash empty content.
  // Regression check on the root cause: `closeDialog` used to null `dialogState`
  // synchronously, so `renderDialogBody` returned null for the remainder of the shared
  // Dialog's fade-out. Proven here at the exact locus of the fix — the props
  // CardListWithABMDialog hands the (non-owned, atom-ban) Dialog organism — since the
  // Modal itself is fully hidden/instant in this test environment and can't carry an
  // observable mid-fade state.
  it('keeps supplying the edit dialog its last content in the same render Close flips open false', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    const openProps = lastCallFor('Edit card');
    expect(openProps.open).toBe(true);
    expect(bodyText(openProps.children)).toBe('Edit form for item-1');

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    const closedProps = lastCallFor('Edit card');

    expect(closedProps.open).toBe(false);
    expect(bodyText(closedProps.children)).toBe('Edit form for item-1');
  });

  // @s20 — same guarantee for the remove dialog.
  it('keeps supplying the remove dialog its last content in the same render Close flips open false', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
      );
    });
    const openProps = lastCallFor('Remove card');
    expect(openProps.open).toBe(true);
    expect(bodyText(openProps.children)).toBe('Remove item-2?');

    await act(async () => {
      fireEvent.press(screen.getByText('Keep it'));
    });
    const closedProps = lastCallFor('Remove card');

    expect(closedProps.open).toBe(false);
    expect(bodyText(closedProps.children)).toBe('Remove item-2?');
  });

  it('only one dialog is open at a time — opening remove after edit closes the edit dialog', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(screen.getByText('Edit card')).toBeTruthy();

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
      );
    });

    expect(screen.queryByText('Edit card')).toBeNull();
    expect(screen.getByText('Remove card')).toBeTruthy();
  });

  // Mutation coverage (line 153/163 — the `isOpen && dialogState?.type === <type>` Dialog `open`
  // guards): opens edit, closes it (per the bug fix, `dialogState` keeps its stale `{type:
  // 'edit', ...}` while only `isOpen` flips false), then opens remove for a DIFFERENT item —
  // asserting each Dialog's own `open` prop at every step, not just the rendered text. The
  // mid-sequence assertion (edit open, remove's own `open` still false) is what a
  // `dialogState?.type === 'remove'` → `true` mutant on line 163 would flip to `true` — since
  // `isOpen` is already `true` at that point, only the real `type` check keeps remove closed
  // while edit is open. The final assertions confirm the stale edit `dialogState` never leaks
  // into either guard once remove replaces it.
  it("gates each Dialog's own open prop by its matching type, never the other stale dialogState", async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    // Open edit (item-1) — only edit's own `open` guard should be true.
    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(lastCallFor('Edit card').open).toBe(true);
    expect(lastCallFor('Remove card').open).toBe(false);

    // Close edit — isOpen flips false; dialogState still holds the stale edit item (bug fix).
    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    expect(lastCallFor('Edit card').open).toBe(false);
    expect(lastCallFor('Remove card').open).toBe(false);

    // Open remove for a DIFFERENT item (item-2) — dialogState is replaced entirely: remove's
    // own guard is true with the new item, edit's stays false, never a mix of both.
    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
      );
    });
    expect(lastCallFor('Remove card').open).toBe(true);
    expect(bodyText(lastCallFor('Remove card').children)).toBe('Remove item-2?');
    expect(lastCallFor('Edit card').open).toBe(false);
  });

  // @s11 — isSubmitting swaps the open edit dialog to a submitting state.
  it('replaces the edit dialog body with SubmittingIndicator and hides its buttons while isSubmitting', async () => {
    const { rerender } = await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(screen.getByText('Edit form for item-1')).toBeTruthy();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: true })} />);

    expect(screen.getByText('Edit card')).toBeTruthy(); // headline still shown
    expect(screen.queryByText('Edit form for item-1')).toBeNull();
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  // @s12 — isSubmitting swaps the open remove dialog to a submitting state.
  it('replaces the remove dialog body with SubmittingIndicator and hides its buttons while isSubmitting', async () => {
    const { rerender } = await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
      );
    });
    expect(screen.getByText('Remove item-2?')).toBeTruthy();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: true })} />);

    expect(screen.getByText('Remove card')).toBeTruthy(); // headline still shown
    expect(screen.queryByText('Remove item-2?')).toBeNull();
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Remove')).toBeNull();
    expect(screen.queryByText('Keep it')).toBeNull();
  });

  // @s13 — isSubmitting returning to false restores the normal content and buttons.
  it('restores the normal dialog content and buttons once isSubmitting returns to false', async () => {
    const { rerender } = await render(
      <CardListWithABMDialog {...makeProps({ isSubmitting: true })} />,
    );

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Edit form for item-1')).toBeNull();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: false })} />);

    expect(screen.queryByText('general.saving')).toBeNull();
    expect(screen.getByText('Edit form for item-1')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  // Mutation coverage: the list/card testIDs are exported constants/helpers that both the
  // component and this file's other assertions import from the same module, so mutating the
  // underlying literal to '' is invisible to a self-referential query. These two assert the
  // literal, hardcoded testID strings instead.
  it('renders the list under its documented literal testID', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.getByTestId('card-list-with-abm-dialog-list')).toBeTruthy();
  });

  it("renders a card's testID as the documented literal template", async () => {
    await render(<CardListWithABMDialog {...makeProps({ items: [items[0]!] })} />);

    expect(screen.getByTestId('card-list-with-abm-dialog-card-item-1')).toBeTruthy();
  });

  // Mutation coverage (line 81 ArrayDeclaration): renderItem must be recomputed — and use the
  // latest getEditAccessibilityLabel/getRemoveAccessibilityLabel closures — on a rerender that
  // changes those props without changing items, not just stay memoized off a stale FlatList cell.
  it('reflects new getEditAccessibilityLabel/getRemoveAccessibilityLabel on rerender, same item', async () => {
    const { rerender } = await render(
      <CardListWithABMDialog {...makeProps({ items: [items[0]!] })} />,
    );

    expect(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button').props
        .accessibilityLabel,
    ).toBe('Edit First card');

    await rerender(
      <CardListWithABMDialog
        {...makeProps({
          items: [items[0]!],
          getEditAccessibilityLabel: () => 'Updated edit label',
          getRemoveAccessibilityLabel: () => 'Updated remove label',
        })}
      />,
    );

    expect(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button').props
        .accessibilityLabel,
    ).toBe('Updated edit label');
    expect(
      within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole('button').props
        .accessibilityLabel,
    ).toBe('Updated remove label');
  });

  // Mutation coverage — static layout tokens in the StyleSheet: this component's styles are
  // plain (non-variant) objects, so — unlike Unistyles variant styles elsewhere in this lib —
  // they DO flatten fully (including color) onto RN elements under jest-expo (verified: probed
  // the rendered tree directly). So each of these is a real behavioral assertion, not a brittle
  // cosmetic snapshot.
  it('lays out the root container with flex and s4 item spacing', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(flattenStyle(list.parent!.props.style)).toEqual({ flex: 1, gap: 16 });
  });

  it('lays out the header as a row, centered, spaced apart, with s3 gap', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const header = screen.getByText('My List').parent;
    expect(flattenStyle(header!.props.style)).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    });
  });

  it('shrinks the title so it never pushes the add button off-screen', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(flattenStyle(screen.getByText('My List').props.style).flexShrink).toBe(1);
  });

  it('gives the list flex:1 to fill available height', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(flattenStyle(list.props.style)).toEqual({ flex: 1 });
  });

  it('spaces list content by s3', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(flattenStyle(list.props.contentContainerStyle)).toEqual({ gap: 12 });
  });

  it('colors the empty-state message', async () => {
    await render(
      <CardListWithABMDialog
        {...makeProps({ items: [], emptyStateMessage: 'Nothing here yet' })}
      />,
    );

    expect(flattenStyle(screen.getByText('Nothing here yet').props.style).color).toBeDefined();
  });

  it("lays out a row's content and actions as a centered horizontal row with spacing", async () => {
    await render(<CardListWithABMDialog {...makeProps({ items: [items[0]!] })} />);

    const card = screen.getByTestId(cardListItemCardTestId('item-1'));
    const row = card.children[0] as typeof card;
    const content = row.children[0] as typeof card;
    const actions = row.children[1] as typeof card;

    expect(flattenStyle(row.props.style)).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    });
    expect(flattenStyle(content.props.style)).toEqual({ flex: 1 });
    expect(flattenStyle(actions.props.style)).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    });
  });
});
