import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import type { CardListWithABMDialogProps } from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { CardListWithABMDialogHeader } from './card-list-with-abm-dialog-header';

type StoryFlashcard = { front: string; back: string };

type StoryArgs = {
  title: string;
  addButtonLabel: string;
  onAddPress: () => void;
};

// Header only reads title/addButtonLabel/onAddPress from context; the Provider's value type is
// the full chrome+dialog contract (same stub shape as the sibling List/CardListWithABMDialog
// stories) — the rest are no-ops this component never touches.
const baseContextValue: Omit<
  CardListWithABMDialogProps<StoryFlashcard>,
  'title' | 'addButtonLabel' | 'onAddPress'
> = {
  items: [],
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
  // Header takes no props of its own (pure context consumer) — the cast is only so Meta/args
  // typing has something concrete to work with; the JSX call stays prop-less below.
  component: CardListWithABMDialogHeader as ComponentType<StoryArgs>,
  render: ({ title, addButtonLabel, onAddPress }) => (
    <CardListWithABMDialogProvider
      value={{ ...baseContextValue, title, addButtonLabel, onAddPress }}
    >
      <CardListWithABMDialogHeader />
    </CardListWithABMDialogProvider>
  ),
  tags: ['CardListWithABMDialog'],
  args: {
    title: 'Flashcards',
    addButtonLabel: 'Add flashcard',

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
        value={{
          ...baseContextValue,
          title: 'Flashcards',
          addButtonLabel: 'Add flashcard',
          onAddPress: () => setTapCount((count) => count + 1),
        }}
      >
        <CardListWithABMDialogHeader />
      </CardListWithABMDialogProvider>
      <Text>{`Added ${tapCount} times`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
