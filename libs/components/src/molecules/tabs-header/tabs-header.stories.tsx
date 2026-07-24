import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from '../../atoms/button/button';

import { TabsHeader } from './tabs-header';

const meta = {
  title: 'Molecules/TabsHeader',
  component: TabsHeader,
  args: {
    title: 'Saved lessons',
  },
} satisfies Meta<typeof TabsHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithAction: Story = {
  args: {
    children: <Button onPress={() => undefined}>New lesson</Button>,
  },
};

export const LongTitle: Story = {
  args: {
    title: 'A very long tab heading that should shrink beside the action',
    children: <Button onPress={() => undefined}>New lesson</Button>,
  },
};
