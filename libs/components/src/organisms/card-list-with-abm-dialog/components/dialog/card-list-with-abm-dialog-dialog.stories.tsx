import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { Text } from 'react-native';
import type { CardListItem } from '../../card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../../hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from '../../hooks/card-list-with-abm-dialog.context.types';
import { CardListWithABMDialogDialog } from './card-list-with-abm-dialog-dialog';

type StoryFlashcard = { front: string; back: string };

const mitochondriaCard: CardListItem<StoryFlashcard> = {
  id: 'card-1',
  content: <Text>Mitochondria — the powerhouse of the cell</Text>,
  accessibleLabel: 'Mitochondria flashcard',
  showEditButton: true,
  showRemoveButton: true,
  data: { front: 'Mitochondria', back: 'The powerhouse of the cell' },
};

const contextValue: CardListWithABMDialogValue<StoryFlashcard> = {
  title: 'Flashcards',
  items: [mitochondriaCard],
  addButtonLabel: 'Add flashcard',
  renderAddForm: () => <Text>Add flashcard form</Text>,
  addDialogTitle: 'Add flashcard',
  renderEditForm: (item) => <Text>{`Edit form for ${item.data.front}`}</Text>,
  editDialogTitle: 'Edit flashcard',
  renderRemoveConfirmation: (item) => (
    <Text>{`Remove "${item.data.front}"? This cannot be undone.`}</Text>
  ),
  getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
  isSubmitting: false,
};

// Generic component — Storybook's `Meta` needs a concrete type, so the story fixes `TItem` to a
// representative shape via a typed cast (same pattern as the parent organism's story).
const CardListWithABMDialogDialogStory = CardListWithABMDialogDialog as ComponentType<{
  open: boolean;
  dialogState: 'open' | 'submitting' | 'closed' | null;
  dialogType: 'add' | 'edit' | 'remove' | null;
  dialogItem: CardListItem<StoryFlashcard> | null;
  onClose?: () => void;
  onSubmit?: () => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  errorMessage?: string;
}>;

const meta = {
  title: 'Organisms/CardListWithABMDialog/Dialog',
  component: CardListWithABMDialogDialogStory,
  decorators: [
    (Story) => (
      <CardListWithABMDialogProvider value={contextValue}>
        <Story />
      </CardListWithABMDialogProvider>
    ),
  ],
  args: {
    open: true,
    dialogState: 'open',
    dialogType: 'add',
    dialogItem: null,
    title: 'Add flashcard',
    submitLabel: 'Add',
    cancelLabel: 'Cancel',
  },
} satisfies Meta<typeof CardListWithABMDialogDialogStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddOpen: Story = {};

export const EditOpen: Story = {
  args: {
    dialogType: 'edit',
    dialogItem: mitochondriaCard,
    title: 'Edit flashcard',
    submitLabel: 'Save',
  },
};

export const RemoveOpen: Story = {
  args: {
    dialogType: 'remove',
    dialogItem: mitochondriaCard,
    title: 'Remove flashcard',
    submitLabel: 'Remove',
  },
};

export const Submitting: Story = {
  args: {
    dialogType: 'edit',
    dialogItem: mitochondriaCard,
    dialogState: 'submitting',
    title: 'Edit flashcard',
  },
};

export const ErrorState: Story = {
  args: {
    dialogType: 'edit',
    dialogItem: mitochondriaCard,
    title: 'Edit flashcard',
    errorMessage: 'Could not save this flashcard. Please try again.',
  },
};

export const Idle: Story = {
  args: {
    dialogType: null,
    dialogState: null,
    title: undefined,
  },
};
