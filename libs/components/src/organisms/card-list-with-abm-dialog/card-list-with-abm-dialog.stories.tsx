import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import { userEvent } from 'storybook/test';

import { CardListWithABMDialog } from './card-list-with-abm-dialog';
import type { CardListItem, CardListWithABMDialogProps } from './card-list-with-abm-dialog.types';

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
  CardListWithABMDialogProps<StoryFlashcard>
>;

const meta = {
  title: 'Organisms/CardListWithABMDialog',
  component: CardListWithABMDialogStory,
  args: {
    title: 'Flashcards',
    items,
    addButtonLabel: 'Add flashcard',
    onAddPress: () => {},
    renderEditForm: (item) => <Text>{`Edit form for ${item.data.front}`}</Text>,
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
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText('Edit Mitochondria flashcard'));
  },
};

/** @s18 — isSubmitting true while the remove dialog is open: body swaps to SubmittingIndicator. */
export const RemoveDialogSubmitting: Story = {
  args: { isSubmitting: true },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText('Remove Photosynthesis flashcard'));
  },
};

/** Demonstrates onAddPress firing — the story renders the resulting tap count. */
const InteractiveAddDemo = () => {
  const [tapCount, setTapCount] = useState(0);
  return (
    <>
      <CardListWithABMDialogStory
        title="Flashcards"
        items={items}
        addButtonLabel="Add flashcard"
        onAddPress={() => setTapCount((count) => count + 1)}
        renderEditForm={(item) => <Text>{`Edit form for ${item.data.front}`}</Text>}
        editDialogTitle="Edit flashcard"
        editSubmitLabel="Save"
        editCancelLabel="Cancel"
        onEditSubmit={() => {}}
        renderRemoveConfirmation={(item) => (
          <Text>{`Remove "${item.data.front}"? This cannot be undone.`}</Text>
        )}
        removeDialogTitle="Remove flashcard"
        removeSubmitLabel="Remove"
        removeCancelLabel="Keep it"
        onRemoveConfirm={() => {}}
        getEditAccessibilityLabel={(item) => `Edit ${item.accessibleLabel}`}
        getRemoveAccessibilityLabel={(item) => `Remove ${item.accessibleLabel}`}
        isSubmitting={false}
      />
      <Text>{`Added ${tapCount} times`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveAddDemo />,
};
