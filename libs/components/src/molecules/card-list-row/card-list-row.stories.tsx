import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ComponentType } from 'react';
import { Text } from 'react-native';

import { CardListRow } from './card-list-row';
import type { CardListRowProps } from './card-list-row.types';

type StoryFlashcard = { front: string; back: string };

// CardListRow is generic (mirrors CardListWithABMDialog's own story) — Storybook's `Meta`
// needs a concrete component type, so the story fixes `TItem` to a representative shape via a
// typed cast.
const CardListRowStory = CardListRow as ComponentType<CardListRowProps<StoryFlashcard>>;

const meta = {
  title: 'Molecules/CardListRow',
  component: CardListRowStory,
  args: {
    item: {
      id: 'card-1',
      content: <Text>Mitochondria — the powerhouse of the cell</Text>,
      accessibleLabel: 'Mitochondria flashcard',
      showEditButton: true,
      showRemoveButton: true,
      data: { front: 'Mitochondria', back: 'The powerhouse of the cell' },
    },
    onEditPress: () => {},
    onRemovePress: () => {},
    getEditAccessibilityLabel: (item) => `Edit ${item.accessibleLabel}`,
    getRemoveAccessibilityLabel: (item) => `Remove ${item.accessibleLabel}`,
  },
} satisfies Meta<typeof CardListRowStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both edit and remove icons shown. */
export const BothIcons: Story = {};

/** Only the edit icon shown. */
export const EditOnly: Story = {
  args: {
    item: {
      ...meta.args.item,
      showEditButton: true,
      showRemoveButton: false,
    },
  },
};

/** Only the remove icon shown. */
export const RemoveOnly: Story = {
  args: {
    item: {
      ...meta.args.item,
      showEditButton: false,
      showRemoveButton: true,
    },
  },
};

/** Disabled — reduced opacity card, both icons still rendered but disabled. */
export const Disabled: Story = {
  args: {
    item: {
      ...meta.args.item,
      disabled: true,
    },
  },
};
