import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '../../atoms/button/button';
import type {
  CardListDialogState,
  CardListItem,
  CardListWithABMDialogProps,
} from '../../organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../../organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context';
import { CardListWithABMDialogRemove } from './card-list-with-abm-dialog-remove';

type StoryFlashcard = { front: string; back: string };

const mitochondriaCard: CardListItem<StoryFlashcard> = {
  id: 'card-1',
  content: <Text>Mitochondria — the powerhouse of the cell</Text>,
  accessibleLabel: 'Mitochondria flashcard',
  showEditButton: true,
  showRemoveButton: true,
  data: { front: 'Mitochondria', back: 'The powerhouse of the cell' },
};

const removingMitochondria: CardListDialogState<StoryFlashcard> = {
  type: 'remove',
  item: mitochondriaCard,
};

type StoryArgs = {
  open: boolean;
  dialogState: CardListDialogState<StoryFlashcard>;
  onClose: () => void;
  isSubmitting: boolean;
};

// Remove only reads removeDialogTitle/removeSubmitLabel/removeCancelLabel/isSubmitting/
// renderRemoveConfirmation/onRemoveConfirm from context; the Provider's value type is the full
// chrome+dialog contract, same stub shape as the sibling Edit/List/Header stories for this
// feature — the rest are no-ops this component never touches.
const baseContextValue: Omit<CardListWithABMDialogProps<StoryFlashcard>, 'isSubmitting'> = {
  title: 'Flashcards',
  items: [mitochondriaCard],
  addButtonLabel: 'Add flashcard',
  onAddPress: () => {},
  renderEditForm: () => null,
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
};

// The story fixes `TItem` via a typed cast, same trick as the sibling Edit/List/CardListWithABMDialog
// stories — the JSX call below stays honestly typed against the component's real props.
const CardListWithABMDialogRemoveStory = CardListWithABMDialogRemove as ComponentType<{
  open: boolean;
  dialogState: CardListDialogState<StoryFlashcard>;
  onClose?: () => void;
}>;

const meta = {
  title: 'Molecules/CardListWithABMDialogRemove',
  tags: ['CardListWithABMDialog'],
  // `isSubmitting` isn't one of the component's own props — it only reaches it via context, wired
  // in `render` below — so it needs an extra cast here purely for Storybook's `args` panel to
  // drive it.
  component: CardListWithABMDialogRemoveStory as unknown as ComponentType<StoryArgs>,
  render: ({ open, dialogState, onClose, isSubmitting }) => (
    <CardListWithABMDialogProvider value={{ ...baseContextValue, isSubmitting }}>
      <CardListWithABMDialogRemoveStory open={open} dialogState={dialogState} onClose={onClose} />
    </CardListWithABMDialogProvider>
  ),
  args: {
    open: true,
    dialogState: removingMitochondria,
    onClose: () => {},
    isSubmitting: false,
  },
} satisfies Meta<StoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const Closed: Story = {
  args: { open: false, dialogState: null },
};

/** Demonstrates onClose/onRemoveConfirm actually firing — the other stories no-op them. */
const InteractiveDemo = () => {
  const [open, setOpen] = useState(true);
  const [lastRemoved, setLastRemoved] = useState('none');

  return (
    <>
      <Button onPress={() => setOpen(true)}>Reopen remove dialog</Button>
      <CardListWithABMDialogProvider
        value={{
          ...baseContextValue,
          isSubmitting: false,
          onRemoveConfirm: (item) => setLastRemoved(item.data.front),
        }}
      >
        <CardListWithABMDialogRemoveStory
          open={open}
          dialogState={removingMitochondria}
          onClose={() => setOpen(false)}
        />
      </CardListWithABMDialogProvider>
      <Text>{`Last removed: ${lastRemoved}`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
