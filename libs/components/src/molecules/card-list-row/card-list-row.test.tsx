import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { CardListItem } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import {
  CardListRow,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-row';

type StoryItem = { note: string };

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const baseItem: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>First card content</Text>,
  accessibleLabel: 'First card',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'first' },
};

const makeProps = (overrides: Partial<CardListItem<StoryItem>> = {}) => ({
  item: { ...baseItem, ...overrides },
  onEditPress: jest.fn(),
  onRemovePress: jest.fn(),
  getEditAccessibilityLabel: (item: CardListItem<StoryItem>) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item: CardListItem<StoryItem>) => `Remove ${item.accessibleLabel}`,
});

describe('CardListRow', () => {
  // @s1 — renders the item's content under its documented literal Card testID.
  it("renders the item's content under its documented literal card testID", async () => {
    await render(<CardListRow {...makeProps()} />);

    expect(screen.getByTestId('card-list-with-abm-dialog-card-item-1')).toBeTruthy();
    expect(screen.getByText('First card content')).toBeTruthy();
  });

  it('exposes cardListItemCardTestId/editTestId/removeTestId as the same literal templates', () => {
    expect(cardListItemCardTestId('item-1')).toBe('card-list-with-abm-dialog-card-item-1');
    expect(cardListItemEditTestId('item-1')).toBe('card-list-with-abm-dialog-edit-item-1');
    expect(cardListItemRemoveTestId('item-1')).toBe('card-list-with-abm-dialog-remove-item-1');
  });

  // @s14 — accessible names are built per-item via the caller's builder props.
  it('builds the edit/remove icon accessible names from get*AccessibilityLabel(item)', async () => {
    await render(<CardListRow {...makeProps()} />);

    const editButton = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    const removeButton = within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole(
      'button',
    );

    expect(editButton.props.accessibilityLabel).toBe('Edit First card');
    expect(removeButton.props.accessibilityLabel).toBe('Remove First card');
  });

  // @s3 — showEditButton: false hides only the edit icon.
  it('hides only the edit icon when showEditButton is false', async () => {
    await render(<CardListRow {...makeProps({ showEditButton: false, showRemoveButton: true })} />);

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.getByTestId(cardListItemRemoveTestId('item-1'))).toBeTruthy();
  });

  // @s4 — showRemoveButton: false hides only the remove icon.
  it('hides only the remove icon when showRemoveButton is false', async () => {
    await render(<CardListRow {...makeProps({ showEditButton: true, showRemoveButton: false })} />);

    expect(screen.getByTestId(cardListItemEditTestId('item-1'))).toBeTruthy();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  it('renders neither edit nor remove icon when both flags are omitted', async () => {
    await render(
      <CardListRow {...makeProps({ showEditButton: undefined, showRemoveButton: undefined })} />,
    );

    expect(screen.queryByTestId(cardListItemEditTestId('item-1'))).toBeNull();
    expect(screen.queryByTestId(cardListItemRemoveTestId('item-1'))).toBeNull();
  });

  // @s2 — disabled item renders at reduced opacity with both icons disabled.
  it('renders a disabled item at theme.disabledOpacity with disabled edit/remove icons', async () => {
    await render(<CardListRow {...makeProps({ disabled: true })} />);

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
    await render(<CardListRow {...makeProps()} />);

    const card = screen.getByTestId(cardListItemCardTestId('item-1'));
    expect(flattenStyle(card.props.style).opacity).toBeUndefined();

    const editButton = within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole(
      'button',
    );
    expect(editButton.props.accessibilityState?.disabled).toBe(false);
  });

  // Press callbacks — the row forwards the tapped item to whichever handler fired.
  it('calls onEditPress with the item when the edit icon is pressed', async () => {
    const onEditPress = jest.fn();
    const onRemovePress = jest.fn();
    await render(
      <CardListRow {...makeProps()} onEditPress={onEditPress} onRemovePress={onRemovePress} />,
    );

    fireEvent.press(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
    );

    expect(onEditPress).toHaveBeenCalledTimes(1);
    expect(onEditPress).toHaveBeenCalledWith(baseItem);
    expect(onRemovePress).not.toHaveBeenCalled();
  });

  it('calls onRemovePress with the item when the remove icon is pressed', async () => {
    const onEditPress = jest.fn();
    const onRemovePress = jest.fn();
    await render(
      <CardListRow {...makeProps()} onEditPress={onEditPress} onRemovePress={onRemovePress} />,
    );

    fireEvent.press(
      within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole('button'),
    );

    expect(onRemovePress).toHaveBeenCalledTimes(1);
    expect(onRemovePress).toHaveBeenCalledWith(baseItem);
    expect(onEditPress).not.toHaveBeenCalled();
  });

  // Mutation coverage — static layout tokens: content/actions row is a horizontal centered flex
  // row, content column flexes to fill remaining row space.
  it("lays out the row's content and actions as a centered horizontal row with spacing", async () => {
    await render(<CardListRow {...makeProps()} />);

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
