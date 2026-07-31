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
import { CardListWithABMDialog } from './card-list-with-abm-dialog';
import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-with-abm-dialog.helpers';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import type { CardListWithABMDialogValue } from './hooks/card-list-with-abm-dialog.context.types';

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
  overrides: Partial<CardListWithABMDialogValue<StoryItem> & CardListWithABMDialogProps> = {},
): CardListWithABMDialogValue<StoryItem> & CardListWithABMDialogProps => ({
  title: 'My List',
  items,
  addButtonLabel: 'Add item',
  showAddButton: true,
  renderAddForm: () => <Text>Add form</Text>,
  addDialogTitle: 'Add card',
  addSubmitLabel: 'Add',
  addCancelLabel: 'Cancel',
  onAddSubmit: jest.fn(),
  renderEditForm: (item?: CardListItem<StoryItem>) => <Text>{`Edit form for ${item?.id}`}</Text>,
  editDialogTitle: 'Edit card',
  editSubmitLabel: 'Save',
  editCancelLabel: 'Cancel',
  onEditSubmit: jest.fn(),
  renderRemoveConfirmation: (item: CardListItem<StoryItem>) => <Text>{`Remove ${item.id}?`}</Text>,
  removeDialogTitle: 'Remove card',
  removeSubmitLabel: 'Remove',
  removeCancelLabel: 'Keep it',
  onRemoveConfirm: jest.fn(),
  getEditAccessibilityLabel: (item: CardListItem<StoryItem>) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item: CardListItem<StoryItem>) => `Remove ${item.accessibleLabel}`,
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

  it('builds the row/edit/remove testID strings in the documented format', () => {
    expect(cardListItemCardTestId('item-1')).toBe('card-list-with-abm-dialog-card-item-1');
    expect(cardListItemEditTestId('item-1')).toBe('card-list-with-abm-dialog-edit-item-1');
    expect(cardListItemRemoveTestId('item-1')).toBe('card-list-with-abm-dialog-remove-item-1');
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

  // @s2/@s3/@s4 — per-row disabled styling/icon-disabled-state and show*Button icon visibility
  // are CardListRow's own concern — covered in card-list-row.test.tsx against the real
  // (non-mocked) molecule. Here the organism only needs to prove it renders that real row.

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

  // @s21 — tapping the add button opens the add dialog with renderAddForm() and static chrome
  // (onAddPress itself is still called once, unchanged — see @s17 in
  // card-list-with-abm-dialog-header.test.tsx and card-list-with-abm-dialog.e2e.js).
  it('opens the add dialog with renderAddForm() and the static add chrome when the add button is pressed', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.queryByText('Add card')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });

    expect(screen.getByText('Add card')).toBeTruthy();
    expect(screen.getByText('Add form')).toBeTruthy();
    expect(screen.getByText('Add')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  // @s17/@s21 (review.md Mini-gate 3, finding 3) — onAddPress fires once through the real
  // openAddDialog wiring (use-card-list-with-abm-dialog.ts), not just in isolation on
  // CardListWithABMDialogHeader (card-list-with-abm-dialog-header.test.tsx already covers that
  // atom on its own). This is the organism-level integration point the header test can't reach.
  it('calls onAddPress once through the real add-button wiring, in addition to opening the dialog', async () => {
    const onAddPress = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onAddPress })} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });

    expect(onAddPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Add card')).toBeTruthy();
  });

  it('opens the add dialog from the empty state too', async () => {
    await render(<CardListWithABMDialog {...makeProps({ items: [] })} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });

    expect(screen.getByText('Add card')).toBeTruthy();
  });

  // @s22 — submitting the add dialog notifies the caller and swaps to the submitting state
  // (mirrors @s11's edit-dialog counterpart: submit swaps to SubmittingIndicator rather than
  // closing outright).
  it('calls onAddSubmit once and swaps to the submitting state once its dialog is submitted', async () => {
    const onAddSubmit = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onAddSubmit })} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Add'));
    });

    expect(onAddSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByText('general.saving')).toBeTruthy();
  });

  // @s23 — canceling the add dialog does not submit (mirrors @s10's remove-dialog counterpart).
  it('closes the add dialog without calling onAddSubmit when Cancel is pressed', async () => {
    const onAddSubmit = jest.fn();
    await render(<CardListWithABMDialog {...makeProps({ onAddSubmit })} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });
    expect(screen.getByText('Add card')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });

    expect(onAddSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText('Add card')).toBeNull();
  });

  // @s24 — closing the add dialog does not flash empty content (mirrors @s19/@s20).
  it('keeps supplying the add dialog its last content in the same render Close flips open false', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });
    const openProps = lastCallFor('Add card');
    expect(openProps.open).toBe(true);
    expect(bodyText(openProps.children)).toBe('Add form');

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    const closedProps = lastCallFor('Add card');

    expect(closedProps.open).toBe(false);
    expect(bodyText(closedProps.children)).toBe('Add form');
  });

  // @s25 — only one of add/edit/remove is open at a time: opening edit while add is open closes
  // the add dialog.
  it('opening edit after add closes the add dialog (only one dialog open at a time)', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });
    expect(screen.getByText('Add card')).toBeTruthy();

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });

    expect(screen.queryByText('Add card')).toBeNull();
    expect(screen.getByText('Edit card')).toBeTruthy();
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

  // @s7 — submitting the edit dialog notifies onEditSubmit once. The item itself is handed to
  // the caller earlier via onEditPress(item) (see "opens the edit dialog with
  // renderEditForm(item)..." below) — onEditSubmit's own signature takes no argument
  // (card-list-with-abm-dialog.context.types.tsx), so there's nothing item-shaped to assert here.
  // Per @s11/@s13, submit swaps the dialog to its submitting state rather than closing it
  // outright — it only fully closes once the caller's own isSubmitting prop returns to false.
  it('calls onEditSubmit once and swaps to the submitting state once its dialog is submitted', async () => {
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
    expect(onEditSubmit).toHaveBeenCalledWith();
    expect(screen.getByText('general.saving')).toBeTruthy();
  });

  // @s8 — submitting the remove dialog notifies onRemoveConfirm once. Same no-argument
  // signature as onEditSubmit above — the item was already handed to the caller via
  // onRemovePress(item). Same submitting-state handoff as @s7 above.
  it('calls onRemoveConfirm once and swaps to the submitting state once its dialog is submitted', async () => {
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
    expect(onRemoveConfirm).toHaveBeenCalledWith();
    expect(screen.getByText('general.saving')).toBeTruthy();
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

  // @s25 — same mutual-exclusivity guarantee for a different pair (edit → remove), per
  // gherkin-scenarios.md's "holds for every pair of the three dialog types, not just adjacent
  // ones".
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

    // Open edit (item-1) — only edit's own `open` guard should be true. There's a single
    // shared Dialog instance (not one persistent Dialog per type), so "remove never leaks
    // open" is asserted as "no remove-headlined render has happened at all yet" — a
    // strictly stronger guarantee than a same-type Dialog sitting there with open: false.
    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(lastCallFor('Edit card').open).toBe(true);
    expect(DialogMock.mock.calls.some(([props]) => props.headline === 'Remove card')).toBe(false);

    // Close edit — isOpen flips false; dialogState still holds the stale edit item (bug fix).
    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    expect(lastCallFor('Edit card').open).toBe(false);
    expect(DialogMock.mock.calls.some(([props]) => props.headline === 'Remove card')).toBe(false);

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

  // Mirrors @s11 — isSubmitting swaps the open add dialog to a submitting state.
  it('replaces the add dialog body with SubmittingIndicator and hides its buttons while isSubmitting', async () => {
    const { rerender } = await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });
    expect(screen.getByText('Add form')).toBeTruthy();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: true })} />);

    expect(screen.getByText('Add card')).toBeTruthy(); // headline still shown
    expect(screen.queryByText('Add form')).toBeNull();
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Add')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  // @s13 (review.md Mini-gate 3, finding 2 — reconciled to "close", not "restore": errorMessage
  // is the dedicated failure channel, so a settled isSubmitting always means done. Matches the
  // real ApiKeySettingsScreen consumer, whose own local reducer deliberately keeps its sticky
  // "still submitting" flag through a successful settle specifically so the dialog closes
  // rather than ever showing its form again — see use-api-key-manager.reducer.ts's
  // `submit/sync`). Opens the edit dialog for real first (so this proves the dialog's own
  // `open` prop, not just its text content, actually flips false) — mirrors @s11's own setup.
  it('closes the dialog (does not restore the form) once isSubmitting returns to false', async () => {
    const { rerender } = await render(<CardListWithABMDialog {...makeProps()} />);

    await act(async () => {
      fireEvent.press(
        within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
      );
    });
    expect(lastCallFor('Edit card').open).toBe(true);
    expect(screen.getByText('Edit form for item-1')).toBeTruthy();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: true })} />);

    expect(lastCallFor('Edit card').open).toBe(true);
    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Edit form for item-1')).toBeNull();

    await rerender(<CardListWithABMDialog {...makeProps({ isSubmitting: false })} />);

    expect(lastCallFor('Edit card').open).toBe(false);
    expect(screen.queryByText('general.saving')).toBeNull();
    expect(screen.queryByText('Edit form for item-1')).toBeNull();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  // @s26 — errorMessage forces the shared dialog open in an error state (ErrorBanner content),
  // regardless of whether an add/edit/remove flow is otherwise active, with a single Close
  // action that calls onClose. Proves errorMessage/submitDisabled (tested in isolation on the
  // CardListWithABMDialogDialog molecule) actually reach the dialog from the top-level
  // CardListWithABMDialog.
  it('forces the shared dialog open with the ErrorBanner and a single Close action when errorMessage is set', async () => {
    const onClose = jest.fn();
    await render(
      <CardListWithABMDialog {...makeProps({ errorMessage: 'Something went wrong', onClose })} />,
    );

    const [dialogProps] = DialogMock.mock.calls.at(-1)!;
    expect(dialogProps.open).toBe(true);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('general.close')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('general.close'));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // @s27 — submitDisabled disables the open dialog's submit button (here, the add dialog).
  it('disables the add dialog submit button when submitDisabled is true', async () => {
    await render(<CardListWithABMDialog {...makeProps({ submitDisabled: true })} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    });

    expect(screen.getByRole('button', { name: 'Add' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });

  // Mutation coverage: CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID is an exported constant that both
  // the component and this file's other assertions import from the same module, so mutating the
  // underlying literal to '' is invisible to a self-referential query. Asserts the literal,
  // hardcoded testID string instead. (The card testID's own literal is covered in
  // card-list-row.test.tsx, where that constant is now owned.)
  it('renders the list under its documented literal testID', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    expect(screen.getByTestId('card-list-with-abm-dialog-list')).toBeTruthy();
  });

  // Mutation coverage (renderItem's dependency-array ArrayDeclaration): renderItem must be
  // recomputed — and use the latest getEditAccessibilityLabel/getRemoveAccessibilityLabel
  // closures — on a rerender that changes those props without changing items, not just stay
  // memoized off a stale FlatList cell.
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

  it('gives the list flex:1 and an s1 padding gutter to fill available height', async () => {
    await render(<CardListWithABMDialog {...makeProps()} />);

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(flattenStyle(list.props.style)).toEqual({ flex: 1, padding: 4 });
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

  // Row-internal layout (content/actions flex row) is CardListRow's own concern — covered in
  // card-list-row.test.tsx.
});
