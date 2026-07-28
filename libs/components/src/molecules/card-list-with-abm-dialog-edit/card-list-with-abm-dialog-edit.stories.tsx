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
import { CardListWithABMDialogEdit } from './card-list-with-abm-dialog-edit';

type StoryFlashcard = { front: string; back: string };

const mitochondriaCard: CardListItem<StoryFlashcard> = {
  id: 'card-1',
  content: <Text>Mitochondria — the powerhouse of the cell</Text>,
  accessibleLabel: 'Mitochondria flashcard',
  showEditButton: true,
  showRemoveButton: true,
  data: { front: 'Mitochondria', back: 'The powerhouse of the cell' },
};

const editingMitochondria: CardListDialogState<StoryFlashcard> = {
  type: 'edit',
  item: mitochondriaCard,
};

type StoryArgs = {
  open: boolean;
  dialogState: CardListDialogState<StoryFlashcard>;
  onClose: () => void;
  isSubmitting: boolean;
};

// Edit only reads editDialogTitle/editSubmitLabel/editCancelLabel/isSubmitting/renderEditForm/
// onEditSubmit from context; the Provider's value type is the full chrome+dialog contract, same
// stub shape as the sibling List/Header stories for this feature — the rest are no-ops this
// component never touches.
const baseContextValue: Omit<CardListWithABMDialogProps<StoryFlashcard>, 'isSubmitting'> = {
  title: 'Flashcards',
  items: [mitochondriaCard],
  addButtonLabel: 'Add flashcard',
  onAddPress: () => {},
  renderEditForm: (item) => <Text>{`Edit form for ${item.data.front}`}</Text>,
  editDialogTitle: 'Edit flashcard',
  editSubmitLabel: 'Save',
  editCancelLabel: 'Cancel',
  onEditSubmit: () => {},
  renderRemoveConfirmation: () => null,
  removeDialogTitle: 'Remove flashcard',
  removeSubmitLabel: 'Remove',
  removeCancelLabel: 'Keep it',
  onRemoveConfirm: () => {},
  getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
  getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
};

// The story fixes `TItem` via a typed cast, same trick as the sibling List/CardListWithABMDialog
// stories — the JSX call below stays honestly typed against the component's real props.
const CardListWithABMDialogEditStory = CardListWithABMDialogEdit as ComponentType<{
  open: boolean;
  dialogState: CardListDialogState<StoryFlashcard>;
  onClose?: () => void;
}>;

const meta = {
  title: 'Molecules/CardListWithABMDialogEdit',
  tags: ['CardListWithABMDialog'],
  // `isSubmitting` isn't one of the component's own props — it only reaches it via context, wired
  // in `render` below — so it needs an extra cast here purely for Storybook's `args` panel to
  // drive it.
  component: CardListWithABMDialogEditStory as unknown as ComponentType<StoryArgs>,
  render: ({ open, dialogState, onClose, isSubmitting }) => (
    <CardListWithABMDialogProvider value={{ ...baseContextValue, isSubmitting }}>
      <CardListWithABMDialogEditStory open={open} dialogState={dialogState} onClose={onClose} />
    </CardListWithABMDialogProvider>
  ),
  args: {
    open: true,
    dialogState: editingMitochondria,
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

/** Demonstrates onClose/onEditSubmit actually firing — the other stories no-op them. */
const InteractiveDemo = () => {
  const [open, setOpen] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState('none');

  return (
    <>
      <Button onPress={() => setOpen(true)}>Reopen edit dialog</Button>
      <CardListWithABMDialogProvider
        value={{
          ...baseContextValue,
          isSubmitting: false,
          onEditSubmit: (item) => setLastSubmitted(item.data.front),
        }}
      >
        <CardListWithABMDialogEditStory
          open={open}
          dialogState={editingMitochondria}
          onClose={() => setOpen(false)}
        />
      </CardListWithABMDialogProvider>
      <Text>{`Last submitted: ${lastSubmitted}`}</Text>
    </>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
