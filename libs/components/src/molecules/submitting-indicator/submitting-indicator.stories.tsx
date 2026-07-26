import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { SubmittingIndicator } from './submitting-indicator';

const meta = {
  title: 'Molecules/SubmittingIndicator',
  component: SubmittingIndicator,
  decorators: [
    (Story) => (
      <View style={{ width: 320, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SubmittingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Linear indeterminate bar + localized "Saving…" live-region label. */
export const Default: Story = {};
