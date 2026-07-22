import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PlayerLoading } from './player-loading';

const meta = {
  title: 'Features/PlayerLoading',
  component: PlayerLoading,
} satisfies Meta<typeof PlayerLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Loading copy while the lesson player fetches. */
export const Default: Story = {};
