// SubmittingIndicator (rendered while isSubmitting) calls useLocalization — mock it as the
// rest of this lib's dialog tests do (e.g. api-key-form-dialog.test.tsx).
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  CardListWithABMDialog,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-with-abm-dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';

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
});
