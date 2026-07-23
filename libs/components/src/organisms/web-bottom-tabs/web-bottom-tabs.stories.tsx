import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { WebBottomTabs } from './web-bottom-tabs';

const sampleTriggers = [
  { name: 'index', href: '/', label: 'My lessons', icon: 'menu_book' },
  { name: 'pdf-files', href: '/pdf-files', label: 'My PDF files', icon: 'picture_as_pdf' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings' },
] as const;

const meta = {
  title: 'Organisms/WebBottomTabs',
  component: WebBottomTabs,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <View style={{ height: 480, width: 390, backgroundColor: '#141218' }}>
        <Story />
      </View>
    ),
  ],
  args: {
    triggers: sampleTriggers,
  },
} satisfies Meta<typeof WebBottomTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Content: Story = {};

export const SingleTab: Story = {
  args: {
    triggers: [{ name: 'index', href: '/', label: 'My lessons', icon: 'menu_book' }],
  },
};
