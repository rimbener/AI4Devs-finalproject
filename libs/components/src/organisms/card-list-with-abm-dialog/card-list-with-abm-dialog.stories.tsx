import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

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
      />
      <Text>{`Added ${tapCount} times`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveAddDemo />,
};
