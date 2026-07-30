import { fireEvent, render, screen } from '@testing-library/react-native';

import { CardListWithABMDialogProvider } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types';
import { CardListWithABMDialogHeader } from './card-list-with-abm-dialog-header';

type StoryItem = { note: string };

/** Full context value with sensible test defaults; pass `overrides` per test. */
const makeContextValue = (
  overrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
): CardListWithABMDialogValue<StoryItem> => ({
  title: 'My List',
  items: [],
  addButtonLabel: 'Add item',
  renderAddForm: () => null,
  addDialogTitle: 'ignored here',
  addSubmitLabel: 'ignored here',
  addCancelLabel: 'ignored here',
  onAddSubmit: jest.fn(),
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
  getEditAccessibilityLabel: () => 'ignored here',
  getRemoveAccessibilityLabel: () => 'ignored here',
  isSubmitting: false,
  ...overrides,
});

const renderHeader = (
  onAddPress: () => void = jest.fn(),
  contextOverrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
  showAddButton = true,
) =>
  render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListWithABMDialogHeader showAddButton={showAddButton} onAddPress={onAddPress} />
    </CardListWithABMDialogProvider>,
  );

describe('CardListWithABMDialogHeader', () => {
  it('exposes the title with accessibilityRole="header"', async () => {
    await renderHeader(jest.fn(), { title: 'Flashcards' });

    expect(screen.getByRole('header', { name: 'Flashcards' })).toBeTruthy();
  });

  it('renders an Add button with the context-provided label as its accessible name', async () => {
    await renderHeader(jest.fn(), { addButtonLabel: 'Add flashcard' });

    expect(screen.getByRole('button', { name: 'Add flashcard' })).toBeTruthy();
  });

  it('calls onAddPress once when the add button is pressed', async () => {
    const onAddPress = jest.fn();
    await renderHeader(onAddPress);

    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));

    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  // Mutation coverage: title/addButtonLabel come straight from context, not a hardcoded string —
  // changing context values without remounting must be reflected on rerender.
  it('reflects new title and addButtonLabel on rerender from the same provider tree', async () => {
    const { rerender } = await renderHeader(jest.fn(), {
      title: 'Old title',
      addButtonLabel: 'Old label',
    });

    expect(screen.getByText('Old title')).toBeTruthy();

    await rerender(
      <CardListWithABMDialogProvider
        value={makeContextValue({ title: 'New title', addButtonLabel: 'New label' })}
      >
        <CardListWithABMDialogHeader showAddButton onAddPress={jest.fn()} />
      </CardListWithABMDialogProvider>,
    );

    expect(screen.getByText('New title')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New label' })).toBeTruthy();
  });
});
