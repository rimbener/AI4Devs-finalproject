import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ImageLightbox } from './image-lightbox';

const meta = {
  title: 'Molecules/ImageLightbox',
  component: ImageLightbox,
  args: {
    visible: true,
    source: { uri: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429' },
    alt: 'Mountain landscape',
    closeLabel: 'Close image',
    onRequestClose: () => undefined,
  },
} satisfies Meta<typeof ImageLightbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Hidden: Story = {
  args: { visible: false },
};
