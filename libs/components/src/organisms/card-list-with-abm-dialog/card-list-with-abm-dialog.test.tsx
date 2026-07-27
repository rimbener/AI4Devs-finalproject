import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  CardListWithABMDialog,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-with-abm-dialog';
import type { CardListItem } from './card-list-with-abm-dialog.types';

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

describe('CardListWithABMDialog', () => {
  // @s1 — populated list renders title, add button, and each item's content.
  it('renders the title, an Add button, and one Card per item', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={items}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.getByText('First card content')).toBeTruthy();
    expect(screen.getByText('Second card content')).toBeTruthy();
    expect(screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeTruthy();
  });

  it('extracts each item id as the FlatList key', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={items}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    const list = screen.getByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID);
    expect(list.props.keyExtractor(items[0])).toBe('item-1');
    expect(list.props.keyExtractor(items[1])).toBe('item-2');
  });

  // @s2 — disabled item renders at reduced opacity with both icons disabled.
  it('renders a disabled item at theme.disabledOpacity with disabled edit/remove icons', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[{ ...items[0]!, disabled: true }]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
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
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[items[0]!]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

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
        title="My List"
        items={[{ ...items[0]!, showEditButton: false, showRemoveButton: true }]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.getByTestId(cardListItemRemoveTestId('item-1'))).toBeTruthy();
  });

  // @s4 — showRemoveButton: false hides only the remove icon.
  it('hides only the remove icon when showRemoveButton is false', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[{ ...items[0]!, showEditButton: true, showRemoveButton: false }]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    expect(screen.getByTestId(cardListItemEditTestId('item-1'))).toBeTruthy();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  it('renders neither edit nor remove icon when both flags are omitted', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[{ ...items[0]!, showEditButton: undefined, showRemoveButton: undefined }]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  // @s15 — empty list with emptyStateMessage.
  it('renders the title, add button, and emptyStateMessage when items is empty and message is set', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
        emptyStateMessage="Nothing here yet"
      />,
    );

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
    expect(screen.queryByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeNull();
  });

  // @s16 — empty list without emptyStateMessage.
  it('renders the title and add button but nothing else when items is empty and no message is set', async () => {
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[]}
        addButtonLabel="Add item"
        onAddPress={jest.fn()}
      />,
    );

    expect(screen.getByText('My List')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.queryByTestId(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID)).toBeNull();
  });

  // @s17 — tapping the add button notifies the caller.
  it('calls onAddPress once when the add button is pressed', async () => {
    const onAddPress = jest.fn();
    await render(
      <CardListWithABMDialog
        title="My List"
        items={items}
        addButtonLabel="Add item"
        onAddPress={onAddPress}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  it('calls onAddPress once from the empty state too', async () => {
    const onAddPress = jest.fn();
    await render(
      <CardListWithABMDialog
        title="My List"
        items={[]}
        addButtonLabel="Add item"
        onAddPress={onAddPress}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });
});
