import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import { CardListWithABMDialogProvider } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types';
import { CardListWithABMDialogHeader } from './card-list-with-abm-dialog-header';

type StoryFlashcard = { front: string; back: string };

type StoryArgs = {
  title: string;
  addButtonLabel: string;
  onAddPress: () => void;
  showAddButton: boolean;
};

// Header reads title/addButtonLabel from context and takes onAddPress as its own prop; the
// Provider's value type is the full chrome+dialog contract (same stub shape as the sibling
// List/CardListWithABMDialog stories) — the rest are no-ops this component never touches.
const baseContextValue: Omit<
  CardListWithABMDialogValue<StoryFlashcard>,
  'title' | 'addButtonLabel'
> = {
  items: [],
  renderAddForm: () => null,
  addDialogTitle: 'Add flashcard',
  addSubmitLabel: 'Add',
  addCancelLabel: 'Cancel',
  onAddSubmit: () => {},
  renderEditForm: () => null,
  editDialogTitle: 'Edit flashcard',
  editSubmitLabel: 'Save',
  editCancelLabel: 'Cancel',
  onEditSubmit: () => {},
  renderRemoveConfirmation: () => null,
  removeDialogTitle: 'Remove flashcard',
  removeSubmitLabel: 'Remove',
  removeCancelLabel: 'Keep it',
  onRemoveConfirm: () => {},
  getEditAccessibilityLabel: () => '',
  getRemoveAccessibilityLabel: () => '',
  isSubmitting: false,
};

const meta = {
  title: 'Atoms/CardListWithABMDialogHeader',
  component: CardListWithABMDialogHeader as ComponentType<StoryArgs>,
  render: ({ title, addButtonLabel, showAddButton, onAddPress }) => (
    <CardListWithABMDialogProvider value={{ ...baseContextValue, title, addButtonLabel }}>
      <CardListWithABMDialogHeader showAddButton={showAddButton} onAddPress={onAddPress} />
    </CardListWithABMDialogProvider>
  ),
  tags: ['CardListWithABMDialog'],
  args: {
    title: 'Flashcards',
    addButtonLabel: 'Add flashcard',
    showAddButton: true,
    onAddPress: () => {},
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTitle: Story = {
  args: {
    title: 'A very long lesson deck title that should shrink beside the add button',
  },
};

/** Demonstrates onAddPress actually firing — the other stories no-op it. */
const InteractiveDemo = () => {
  const [tapCount, setTapCount] = useState(0);

  return (
    <>
      <CardListWithABMDialogProvider
        value={{ ...baseContextValue, title: 'Flashcards', addButtonLabel: 'Add flashcard' }}
      >
        <CardListWithABMDialogHeader onAddPress={() => setTapCount((count) => count + 1)} />
      </CardListWithABMDialogProvider>
      <Text>{`Added ${tapCount} times`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
