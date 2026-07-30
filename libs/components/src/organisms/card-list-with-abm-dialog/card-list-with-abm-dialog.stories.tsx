import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import { userEvent } from 'storybook/test';
import { CardListWithABMDialog } from './card-list-with-abm-dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';
import type { CardListWithABMDialogValue } from './hooks/card-list-with-abm-dialog.context.types';

type StoryFlashcard = { front: string; back: string };

const mitochondriaCard: CardListItem<StoryFlashcard> = {
  id: 'card-1',
  content: <Text>Mitochondria — the powerhouse of the cell</Text>,
  accessibleLabel: 'Mitochondria flashcard',
  showEditButton: true,
  showRemoveButton: true,
  data: { front: 'Mitochondria', back: 'The powerhouse of the cell' },
};

const photosynthesisCard: CardListItem<StoryFlashcard> = {
  id: 'card-2',
  content: <Text>Photosynthesis — converts light into chemical energy</Text>,
  accessibleLabel: 'Photosynthesis flashcard',
  showEditButton: true,
  showRemoveButton: true,
  data: { front: 'Photosynthesis', back: 'Converts light into chemical energy' },
};

const items: CardListItem<StoryFlashcard>[] = [mitochondriaCard, photosynthesisCard];

// This is the lib's first generic component (spec.md) — Storybook's `Meta` needs a concrete
// component type, so the story fixes `TItem` to a representative shape via a typed cast.
const CardListWithABMDialogStory = CardListWithABMDialog as ComponentType<
  CardListWithABMDialogValue<StoryFlashcard> & CardListWithABMDialogProps
>;

const meta = {
  title: 'Organisms/CardListWithABMDialog',
  component: CardListWithABMDialogStory,
  tags: ['CardListWithABMDialog'],
  args: {
    title: 'Flashcards',
    items,
    showAddButton: true,
    addButtonLabel: 'Add flashcard',
    renderAddForm: () => <Text>Add flashcard form</Text>,
    addDialogTitle: 'Add flashcard',
    addSubmitLabel: 'Add',
    addCancelLabel: 'Cancel',
    onAddSubmit: () => {},
    renderEditForm: (item?: CardListItem<StoryFlashcard>) => (
      <Text>{`Edit form for ${item?.data.front}`}</Text>
    ),
    editDialogTitle: 'Edit flashcard',
    editSubmitLabel: 'Save',
    editCancelLabel: 'Cancel',
    onEditSubmit: () => {},
    renderRemoveConfirmation: (item) => (
      <Text>{`Remove "${item.data.front}"? This cannot be undone.`}</Text>
    ),
    removeDialogTitle: 'Remove flashcard',
    removeSubmitLabel: 'Remove',
    removeCancelLabel: 'Keep it',
    onRemoveConfirm: () => {},
    getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
    getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
    isSubmitting: false,
  },
} satisfies Meta<typeof CardListWithABMDialogStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const EmptyWithMessage: Story = {
  args: {
    items: [],
    emptyStateMessage: 'No flashcards yet. Add one to get started.',
  },
};

export const EmptyWithoutMessage: Story = {
  args: {
    items: [],
  },
};

export const DisabledCard: Story = {
  args: {
    items: [{ ...mitochondriaCard, disabled: true }, photosynthesisCard],
  },
};

export const EditOnlyCard: Story = {
  args: {
    items: [{ ...mitochondriaCard, showEditButton: true, showRemoveButton: false }],
  },
};

export const RemoveOnlyCard: Story = {
  args: {
    items: [{ ...mitochondriaCard, showEditButton: false, showRemoveButton: true }],
  },
};

/** @s18 — add dialog open: tap the add button to open it, showing renderAddForm(). */
export const AddDialogOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add flashcard' }));
  },
};

/** @s18 — isSubmitting true while the add dialog is open: body swaps to SubmittingIndicator. */
export const AddDialogSubmitting: Story = {
  args: { isSubmitting: true },
};

/** @s18 — edit dialog open: tap the edit icon to open it, showing renderEditForm(item). */
export const EditDialogOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText('Edit Mitochondria flashcard'));
  },
};

/** @s18 — remove dialog open: tap the remove icon to open the remove-confirmation dialog. */
export const RemoveDialogOpen: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText('Remove Photosynthesis flashcard'));
  },
};

/** @s18 — isSubmitting true while the edit dialog is open: body swaps to SubmittingIndicator. */
export const EditDialogSubmitting: Story = {
  args: { isSubmitting: true },
};

/** @s18 — isSubmitting true while the remove dialog is open: body swaps to SubmittingIndicator. */
export const RemoveDialogSubmitting: Story = {
  args: { isSubmitting: true },
};

/** Demonstrates onAddSubmit/onEditSubmit/onRemoveConfirm firing — the story renders a tap count. */
const InteractiveAddDemo = () => {
  const [tapCount, setTapCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setTapCount((count) => count + 1);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <>
      <CardListWithABMDialogStory
        title="Flashcards"
        items={items}
        showAddButton
        addButtonLabel="Add flashcard"
        renderAddForm={() => <Text>Add flashcard form</Text>}
        addDialogTitle="Add flashcard"
        addSubmitLabel="Add"
        addCancelLabel="Cancel"
        onAddSubmit={handleSubmit}
        renderEditForm={(item?: CardListItem<StoryFlashcard>) => (
          <Text>{`Edit form for ${item?.data.front}`}</Text>
        )}
        editDialogTitle="Edit flashcard"
        editSubmitLabel="Save"
        editCancelLabel="Cancel"
        onEditSubmit={handleSubmit}
        renderRemoveConfirmation={(item) => (
          <Text>{`Remove "${item.data.front}"? This cannot be undone.`}</Text>
        )}
        removeDialogTitle="Remove flashcard"
        removeSubmitLabel="Remove"
        removeCancelLabel="Keep it"
        onRemoveConfirm={handleSubmit}
        getEditAccessibilityLabel={(item) => `Edit ${item.accessibleLabel}`}
        getRemoveAccessibilityLabel={(item) => `Remove ${item.accessibleLabel}`}
        isSubmitting={isSubmitting}
      />
      <Text>{`Submitted ${tapCount} times`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveAddDemo />,
};
