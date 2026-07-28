import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';
import type {
  CardListItem,
  CardListWithABMDialogProps,
} from '../card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { CardListWithABMDialogList } from './card-list-with-abm-dialog-list';

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

// This list only reads `items` + the two accessibility-label builders from context, but the
// Provider's value type is the full chrome+dialog contract (mirrors the sibling
// CardListWithABMDialog story's fixture) — the rest are stubbed no-ops this component never
// touches.
const baseContextValue: Omit<CardListWithABMDialogProps<StoryFlashcard>, 'items'> = {
  title: 'Flashcards',
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
};

type StoryArgs = {
  items: CardListItem<StoryFlashcard>[];
  openEditDialog: (item: CardListItem<StoryFlashcard>) => void;
  openRemoveDialog: (item: CardListItem<StoryFlashcard>) => void;
};

// The lib's second generic component (after CardListWithABMDialog) — Meta needs a concrete
// component type, so the story fixes `TItem` via a typed cast, same trick as the sibling story.
const CardListWithABMDialogListStory = CardListWithABMDialogList as ComponentType<{
  openEditDialog: (item: CardListItem<StoryFlashcard>) => void;
  openRemoveDialog: (item: CardListItem<StoryFlashcard>) => void;
}>;

const meta = {
  title: 'Organisms/CardListWithABMDialogList',
  // `items` isn't one of the component's own props — it only reaches it via context, wired in
  // `render` below — so it needs an extra cast here purely for Storybook's `args` panel to drive
  // it; the JSX call above stays honestly typed against the component's real props.
  component: CardListWithABMDialogListStory as unknown as ComponentType<StoryArgs>,
  render: ({ items, openEditDialog, openRemoveDialog }) => (
    <CardListWithABMDialogProvider value={{ ...baseContextValue, items }}>
      <CardListWithABMDialogListStory
        openEditDialog={openEditDialog}
        openRemoveDialog={openRemoveDialog}
      />
    </CardListWithABMDialogProvider>
  ),
  tags: ['CardListWithABMDialog'],
  args: {
    items: [mitochondriaCard, photosynthesisCard],
    openEditDialog: () => {},
    openRemoveDialog: () => {},
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { items: [] },
};

export const DisabledCard: Story = {
  args: { items: [{ ...mitochondriaCard, disabled: true }, photosynthesisCard] },
};

export const EditOnlyCard: Story = {
  args: { items: [{ ...mitochondriaCard, showEditButton: true, showRemoveButton: false }] },
};

export const RemoveOnlyCard: Story = {
  args: { items: [{ ...mitochondriaCard, showEditButton: false, showRemoveButton: true }] },
};

/** Demonstrates openEditDialog/openRemoveDialog actually firing — the other stories no-op them. */
const InteractiveDemo = () => {
  const [lastAction, setLastAction] = useState('none');

  return (
    <>
      <CardListWithABMDialogProvider
        value={{ ...baseContextValue, items: [mitochondriaCard, photosynthesisCard] }}
      >
        <CardListWithABMDialogListStory
          openEditDialog={(item) => setLastAction(`edit ${item.data.front}`)}
          openRemoveDialog={(item) => setLastAction(`remove ${item.data.front}`)}
        />
      </CardListWithABMDialogProvider>
      <Text>{`Last action: ${lastAction}`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
