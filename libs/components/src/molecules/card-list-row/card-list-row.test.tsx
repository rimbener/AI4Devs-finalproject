import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CardListRow } from './card-list-row';
import type { CardListRowProps } from './card-list-row.types';

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const makeProps = (overrides: Partial<CardListRowProps> = {}): CardListRowProps => ({
  content: <Text>First card content</Text>,
  showEditButton: true,
  showRemoveButton: true,
  onEditPress: jest.fn(),
  onRemovePress: jest.fn(),
  editAccessibilityLabel: 'Edit First card',
  removeAccessibilityLabel: 'Remove First card',
  testID: 'row-card',
  editTestID: 'row-edit',
  removeTestID: 'row-remove',
  ...overrides,
});

describe('CardListRow', () => {
  // @s1 — renders the caller's content under the caller-supplied Card testID.
  it("renders the caller's content under the caller-supplied testID", async () => {
    await render(<CardListRow {...makeProps()} />);

    expect(screen.getByTestId('row-card')).toBeTruthy();
    expect(screen.getByText('First card content')).toBeTruthy();
  });

  // @s14 — accessible names come straight from the caller-resolved props.
  it('sets the edit/remove icon accessible names from the caller-resolved props', async () => {
    await render(<CardListRow {...makeProps()} />);

    const editButton = within(screen.getByTestId('row-edit')).getByRole('button');
    const removeButton = within(screen.getByTestId('row-remove')).getByRole('button');

    expect(editButton.props.accessibilityLabel).toBe('Edit First card');
    expect(removeButton.props.accessibilityLabel).toBe('Remove First card');
  });

  // @s3 — showEditButton: false hides only the edit icon.
  it('hides only the edit icon when showEditButton is false', async () => {
    await render(<CardListRow {...makeProps({ showEditButton: false, showRemoveButton: true })} />);

    expect(screen.queryByTestId('row-edit')).toBeNull();
    expect(screen.getByTestId('row-remove')).toBeTruthy();
  });

  // @s4 — showRemoveButton: false hides only the remove icon.
  it('hides only the remove icon when showRemoveButton is false', async () => {
    await render(<CardListRow {...makeProps({ showEditButton: true, showRemoveButton: false })} />);

    expect(screen.getByTestId('row-edit')).toBeTruthy();
    expect(screen.queryByTestId('row-remove')).toBeNull();
  });

  it('renders neither edit nor remove icon when both flags are omitted', async () => {
    await render(
      <CardListRow {...makeProps({ showEditButton: undefined, showRemoveButton: undefined })} />,
    );

    expect(screen.queryByTestId('row-edit')).toBeNull();
    expect(screen.queryByTestId('row-remove')).toBeNull();
  });

  // @s2 — disabled item renders at reduced opacity with both icons disabled.
  it('renders a disabled row at theme.disabledOpacity with disabled edit/remove icons', async () => {
    await render(<CardListRow {...makeProps({ disabled: true })} />);

    const card = screen.getByTestId('row-card');
    expect(flattenStyle(card.props.style).opacity).toBe(0.38);

    const editButton = within(screen.getByTestId('row-edit')).getByRole('button');
    const removeButton = within(screen.getByTestId('row-remove')).getByRole('button');
    expect(editButton.props.accessibilityState?.disabled).toBe(true);
    expect(removeButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('does not reduce opacity or disable icons for a non-disabled row', async () => {
    await render(<CardListRow {...makeProps()} />);

    const card = screen.getByTestId('row-card');
    expect(flattenStyle(card.props.style).opacity).toBeUndefined();

    const editButton = within(screen.getByTestId('row-edit')).getByRole('button');
    expect(editButton.props.accessibilityState?.disabled).toBe(false);
  });

  // Press callbacks — the row calls whichever handler fired, with no args (the caller already
  // bound whatever identity it needs before passing the handler down).
  it('calls onEditPress when the edit icon is pressed', async () => {
    const onEditPress = jest.fn();
    const onRemovePress = jest.fn();
    await render(<CardListRow {...makeProps({ onEditPress, onRemovePress })} />);

    fireEvent.press(within(screen.getByTestId('row-edit')).getByRole('button'));

    expect(onEditPress).toHaveBeenCalledTimes(1);
    expect(onRemovePress).not.toHaveBeenCalled();
  });

  it('calls onRemovePress when the remove icon is pressed', async () => {
    const onEditPress = jest.fn();
    const onRemovePress = jest.fn();
    await render(<CardListRow {...makeProps({ onEditPress, onRemovePress })} />);

    fireEvent.press(within(screen.getByTestId('row-remove')).getByRole('button'));

    expect(onRemovePress).toHaveBeenCalledTimes(1);
    expect(onEditPress).not.toHaveBeenCalled();
  });

  // Mutation coverage — static layout tokens: content/actions row is a horizontal centered flex
  // row, content column flexes to fill remaining row space.
  it("lays out the row's content and actions as a centered horizontal row with spacing", async () => {
    await render(<CardListRow {...makeProps()} />);

    const card = screen.getByTestId('row-card');
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
