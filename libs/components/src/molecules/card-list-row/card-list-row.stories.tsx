import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';

import { CardListRow } from './card-list-row';

const meta = {
  title: 'Molecules/CardListRow',
  component: CardListRow,
  args: {
    content: <Text>Mitochondria — the powerhouse of the cell</Text>,
    showEditButton: true,
    showRemoveButton: true,
    onEditPress: () => {},
    onRemovePress: () => {},
    editAccessibilityLabel: 'Edit Mitochondria flashcard',
    removeAccessibilityLabel: 'Remove Mitochondria flashcard',
  },
} satisfies Meta<typeof CardListRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both edit and remove icons shown. */
export const BothIcons: Story = {};

/** Only the edit icon shown. */
export const EditOnly: Story = {
  args: {
    showEditButton: true,
    showRemoveButton: false,
  },
};

/** Only the remove icon shown. */
export const RemoveOnly: Story = {
  args: {
    showEditButton: false,
    showRemoveButton: true,
  },
};

/** Disabled — reduced opacity card, both icons still rendered but disabled. */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
