import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  type CardListItem,
  type CardListWithABMDialogProps,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from '../card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { CardListWithABMDialogList } from './card-list-with-abm-dialog-list';

type StoryItem = { note: string };

const item1: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>First card content</Text>,
  accessibleLabel: 'First card',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'first' },
};

const item2: CardListItem<StoryItem> = {
  id: 'item-2',
  content: <Text>Second card content</Text>,
  accessibleLabel: 'Second card',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'second' },
};

/** Full context value with sensible test defaults; pass `overrides` per test. */
const makeContextValue = (
  overrides: Partial<CardListWithABMDialogProps<StoryItem>> = {},
): CardListWithABMDialogProps<StoryItem> => ({
  title: 'ignored here',
  items: [item1, item2],
  addButtonLabel: 'ignored here',
  onAddPress: jest.fn(),
  renderEditForm: () => null,
  editDialogTitle: 'ignored here',
  editSubmitLabel: 'ignored here',
  editCancelLabel: 'ignored here',
  onEditSubmit: jest.fn(),
  renderRemoveConfirmation: () => null,
  removeDialogTitle: 'ignored here',
  removeSubmitLabel: 'ignored here',
  removeCancelLabel: 'ignored here',
  onRemoveConfirm: jest.fn(),
  getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
  isSubmitting: false,
  ...overrides,
});

const renderList = (
  props: {
    openEditDialog: (item: CardListItem<StoryItem>) => void;
    openRemoveDialog: (item: CardListItem<StoryItem>) => void;
  },
  contextOverrides: Partial<CardListWithABMDialogProps<StoryItem>> = {},
) =>
  render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListWithABMDialogList {...props} />
    </CardListWithABMDialogProvider>,
  );

describe('CardListWithABMDialogList', () => {
  it('renders a FlatList under the documented testID with each item from context', async () => {
    await renderList({ openEditDialog: jest.fn(), openRemoveDialog: jest.fn() });

    expect(screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeTruthy();
    expect(screen.getByText('First card content')).toBeTruthy();
    expect(screen.getByText('Second card content')).toBeTruthy();
  });

  it('extracts each item id as the FlatList key', async () => {
    await renderList({ openEditDialog: jest.fn(), openRemoveDialog: jest.fn() });

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(list.props.keyExtractor(item1)).toBe('item-1');
    expect(list.props.keyExtractor(item2)).toBe('item-2');
  });

  it('builds each edit/remove icon accessible name from context, distinct per card', async () => {
    await renderList({ openEditDialog: jest.fn(), openRemoveDialog: jest.fn() });

    const editButton1 = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    const removeButton2 = within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole(
      'button',
    );

    expect(editButton1.props.accessibilityLabel).toBe('Edit First card');
    expect(removeButton2.props.accessibilityLabel).toBe('Remove Second card');
  });

  it('calls openEditDialog with the item when that row edit icon is pressed', async () => {
    const openEditDialog = jest.fn();
    await renderList({ openEditDialog, openRemoveDialog: jest.fn() });

    fireEvent.press(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
    );

    expect(openEditDialog).toHaveBeenCalledTimes(1);
    expect(openEditDialog).toHaveBeenCalledWith(item1);
  });

  it('calls openRemoveDialog with the item when that row remove icon is pressed', async () => {
    const openRemoveDialog = jest.fn();
    await renderList({ openEditDialog: jest.fn(), openRemoveDialog });

    fireEvent.press(
      within(screen.getByTestId(cardListItemRemoveTestId('item-2'))).getByRole('button'),
    );

    expect(openRemoveDialog).toHaveBeenCalledTimes(1);
    expect(openRemoveDialog).toHaveBeenCalledWith(item2);
  });

  // Mutation coverage (renderItem's dependency array): the accessible-name builders must be
  // re-read on a rerender that changes them without changing items, not stay memoized off a
  // stale FlatList cell — mirrors the equivalent test in the parent organism's own suite,
  // scoped here to the component that actually owns wiring these context values into the row.
  it('reflects new getEditAccessibilityLabel/getRemoveAccessibilityLabel on rerender, same item', async () => {
    const { rerender } = await renderList(
      { openEditDialog: jest.fn(), openRemoveDialog: jest.fn() },
      { items: [item1] },
    );

    expect(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button').props
        .accessibilityLabel,
    ).toBe('Edit First card');

    await rerender(
      <CardListWithABMDialogProvider
        value={makeContextValue({
          items: [item1],
          getEditAccessibilityLabel: () => 'Updated edit label',
          getRemoveAccessibilityLabel: () => 'Updated remove label',
        })}
      >
        <CardListWithABMDialogList openEditDialog={jest.fn()} openRemoveDialog={jest.fn()} />
      </CardListWithABMDialogProvider>,
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

  // Mutation coverage: renderItem's dependency array includes openEditDialog/openRemoveDialog —
  // a stale closure from the FIRST render must never survive a prop update.
  it('calls the latest openEditDialog after the prop updates, same items', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = await renderList(
      { openEditDialog: first, openRemoveDialog: jest.fn() },
      { items: [item1] },
    );

    await rerender(
      <CardListWithABMDialogProvider value={makeContextValue({ items: [item1] })}>
        <CardListWithABMDialogList openEditDialog={second} openRemoveDialog={jest.fn()} />
      </CardListWithABMDialogProvider>,
    );

    fireEvent.press(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
    );

    expect(second).toHaveBeenCalledWith(item1);
    expect(first).not.toHaveBeenCalled();
  });

  // Positive counterpart to the above — when neither the props nor the context accessibility
  // builders change identity, renderItem must stay memoized (kills an emptied-dependency-array
  // mutant in the opposite direction: always recomputing would also pass the test above). Uses
  // stable, module-scoped label builders on both renders — `makeContextValue`'s own defaults are
  // fresh closures per call by design (fine for every other test here), which would make this one
  // a false negative for a cause this component doesn't own (the caller re-creating its context
  // value), not the memoization this test targets.
  const stableGetEditLabel = (i: CardListItem<StoryItem>) => `Edit ${i.accessibleLabel}`;
  const stableGetRemoveLabel = (i: CardListItem<StoryItem>) => `Remove ${i.accessibleLabel}`;

  it('keeps a stable FlatList renderItem identity across a rerender when nothing relevant changed', async () => {
    const openEditDialog = jest.fn();
    const openRemoveDialog = jest.fn();
    const stableContextValue = makeContextValue({
      items: [item1],
      getEditAccessibilityLabel: stableGetEditLabel,
      getRemoveAccessibilityLabel: stableGetRemoveLabel,
    });

    const { rerender } = await render(
      <CardListWithABMDialogProvider value={stableContextValue}>
        <CardListWithABMDialogList
          openEditDialog={openEditDialog}
          openRemoveDialog={openRemoveDialog}
        />
      </CardListWithABMDialogProvider>,
    );
    const first = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID).props.renderItem;

    await rerender(
      <CardListWithABMDialogProvider value={stableContextValue}>
        <CardListWithABMDialogList
          openEditDialog={openEditDialog}
          openRemoveDialog={openRemoveDialog}
        />
      </CardListWithABMDialogProvider>,
    );

    expect(screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID).props.renderItem).toBe(first);
  });
});
