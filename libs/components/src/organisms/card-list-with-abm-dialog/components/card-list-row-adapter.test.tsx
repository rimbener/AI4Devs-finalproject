// Spy on CardListRow while fully delegating to its real implementation — lets this suite inspect
// the exact flat props the adapter hands the molecule (resolved accessible names, testIDs,
// item-bound callbacks), without editing or replacing CardListRow itself (non-owned, atom-ban).
jest.mock('../../../molecules/card-list-row/card-list-row', () => {
  const actual = jest.requireActual('../../../molecules/card-list-row/card-list-row');
  // CardListRow is memo()-wrapped (not a plain function), so `jest.fn(actual.CardListRow)`
  // can't call it — reach for the underlying render function via `.type`.
  return {
    ...actual,
    CardListRow: jest.fn(actual.CardListRow.type),
  };
});

import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CardListRow } from '../../../molecules/card-list-row/card-list-row';
import type { CardListItem } from '../card-list-with-abm-dialog.types';
import {
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from '../card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from '../hooks/card-list-with-abm-dialog.context.types';
import { CardListRowAdapter } from './card-list-row-adapter';

type StoryItem = { note: string };

const CardListRowMock = CardListRow as unknown as jest.Mock;

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>First card content</Text>,
  accessibleLabel: 'First card',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'first' },
};

const makeContextValue = (
  overrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
): CardListWithABMDialogValue<StoryItem> => ({
  title: 'My List',
  items: [item],
  addButtonLabel: 'Add item',
  renderAddForm: () => <Text>Add form</Text>,
  addDialogTitle: 'Add card',
  renderEditForm: () => <Text>Edit form</Text>,
  editDialogTitle: 'Edit card',
  renderRemoveConfirmation: () => <Text>Remove confirmation</Text>,
  getEditAccessibilityLabel: (i) => `Edit ${i.accessibleLabel}`,
  getRemoveAccessibilityLabel: (i) => `Remove ${i.accessibleLabel}`,
  isSubmitting: false,
  ...overrides,
});

const renderAdapter = async (
  props: Partial<Parameters<typeof CardListRowAdapter<StoryItem>>[0]> = {},
  contextOverrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
) => {
  const onEditPress = props.onEditPress ?? jest.fn();
  const onRemovePress = props.onRemovePress ?? jest.fn();
  const utils = await render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListRowAdapter<StoryItem>
        item={item}
        onEditPress={onEditPress}
        onRemovePress={onRemovePress}
        {...props}
      />
    </CardListWithABMDialogProvider>,
  );
  return { ...utils, onEditPress, onRemovePress };
};

describe('CardListRowAdapter', () => {
  beforeEach(() => {
    CardListRowMock.mockClear();
  });

  it('maps item content/disabled/show*Button flags straight through to CardListRow', async () => {
    await renderAdapter({ item: { ...item, disabled: true } });

    expect(screen.getByText('First card content')).toBeTruthy();
    const [props] = CardListRowMock.mock.calls[0]!;
    expect(props.disabled).toBe(true);
    expect(props.showEditButton).toBe(true);
    expect(props.showRemoveButton).toBe(true);
  });

  it("builds the row's testIDs from the item id via the documented literal format", async () => {
    await renderAdapter();

    expect(screen.getByTestId(cardListItemCardTestId('item-1'))).toBeTruthy();
    expect(screen.getByTestId(cardListItemEditTestId('item-1'))).toBeTruthy();
    expect(screen.getByTestId(cardListItemRemoveTestId('item-1'))).toBeTruthy();
  });

  it('resolves edit/remove accessible names via the context builder props', async () => {
    await renderAdapter(
      {},
      {
        getEditAccessibilityLabel: (i) => `Custom edit for ${i.accessibleLabel}`,
        getRemoveAccessibilityLabel: (i) => `Custom remove for ${i.accessibleLabel}`,
      },
    );

    const [props] = CardListRowMock.mock.calls[0]!;
    expect(props.editAccessibilityLabel).toBe('Custom edit for First card');
    expect(props.removeAccessibilityLabel).toBe('Custom remove for First card');
  });

  // a11y regression guard — getEditAccessibilityLabel/getRemoveAccessibilityLabel are required
  // on the context value, so the adapter always resolves defined accessible names for the row's
  // edit/remove icons — never an undefined, nameless focusable button.
  it('always resolves a defined edit/remove accessible name from the required context builder props', async () => {
    await renderAdapter();

    const [props] = CardListRowMock.mock.calls[0]!;
    expect(props.editAccessibilityLabel).toBe('Edit First card');
    expect(props.removeAccessibilityLabel).toBe('Remove First card');
  });

  it('calls onEditPress with the bound item when the edit icon is pressed', async () => {
    const { onEditPress, onRemovePress } = await renderAdapter();

    fireEvent.press(
      within(screen.getByTestId(cardListItemEditTestId('item-1'))).getByRole('button'),
    );

    expect(onEditPress).toHaveBeenCalledWith(item);
    expect(onRemovePress).not.toHaveBeenCalled();
  });

  it('calls onRemovePress with the bound item when the remove icon is pressed', async () => {
    const { onEditPress, onRemovePress } = await renderAdapter();

    fireEvent.press(
      within(screen.getByTestId(cardListItemRemoveTestId('item-1'))).getByRole('button'),
    );

    expect(onRemovePress).toHaveBeenCalledWith(item);
    expect(onEditPress).not.toHaveBeenCalled();
  });

  it('keeps the same edit/remove handler identity across a rerender with unchanged deps', async () => {
    const onEditPress = jest.fn();
    const onRemovePress = jest.fn();
    const { rerender } = await renderAdapter({ onEditPress, onRemovePress });

    const firstCallProps = CardListRowMock.mock.calls[0]![0];

    await rerender(
      <CardListWithABMDialogProvider value={makeContextValue()}>
        <CardListRowAdapter<StoryItem>
          item={item}
          onEditPress={onEditPress}
          onRemovePress={onRemovePress}
          cardStyle={{ opacity: 1 }}
        />
      </CardListWithABMDialogProvider>,
    );

    const lastCallProps = CardListRowMock.mock.calls.at(-1)![0];
    expect(lastCallProps.onEditPress).toBe(firstCallProps.onEditPress);
    expect(lastCallProps.onRemovePress).toBe(firstCallProps.onRemovePress);
  });

  it('passes cardStyle through to CardListRow', async () => {
    const cardStyle = { marginTop: 8 };
    await renderAdapter({ cardStyle });

    const [props] = CardListRowMock.mock.calls[0]!;
    expect(props.style).toBe(cardStyle);
  });
});
