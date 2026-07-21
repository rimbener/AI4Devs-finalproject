import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { configureSlideImageUrlMock } from '../../../.storybook/mocks/hooks';
import { SlideImage } from './slide-image';

const withSlideImageUrlMock =
  (config: Parameters<typeof configureSlideImageUrlMock>[0]): Decorator =>
  (StoryFn) => {
    configureSlideImageUrlMock(config);
    return <StoryFn />;
  };

const meta = {
  title: 'Organisms/SlideImage',
  component: SlideImage,
  decorators: [
    (Story) => (
      <View style={styles.stackedContainer}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SlideImage>;

export default meta;

type Story = StoryObj<typeof meta>;

// @s7 — Content: signed URL provided via Storybook hooks mock.
export const WithImage: Story = {
  decorators: [
    withSlideImageUrlMock({
      url: 'https://picsum.photos/seed/lesson-player/400/300',
      isLoading: false,
    }),
  ],
  args: {
    image: {
      imageId: 'img-1',
      storagePath: 'demo/diagram.png',
      width: 400,
      height: 300,
      alt: 'A sample diagram',
    },
  },
};

// @s2 — split: bounded, wide pane with the same expandable control.
export const SplitImage: Story = {
  decorators: [
    withSlideImageUrlMock({
      url: 'https://picsum.photos/seed/split-lesson-player/400/800',
      isLoading: false,
    }),
    (Story) => (
      <View style={styles.splitContainer}>
        <Story />
      </View>
    ),
  ],
  args: {
    image: {
      imageId: 'img-split',
      storagePath: 'demo/portrait-diagram.png',
      width: 400,
      height: 800,
      alt: 'A portrait sample diagram',
    },
    layout: 'split',
  },
};

// @s8 — no image → renders nothing.
export const NoImage: Story = {
  args: {
    image: undefined,
  },
};

const styles = StyleSheet.create((theme) => ({
  stackedContainer: {
    width: theme.layout.contentReading,
    padding: theme.spacing.s4,
  },
  splitContainer: {
    width: theme.layout.contentMax,
    height: theme.layout.contentReading,
    padding: theme.spacing.s4,
  },
}));

// @s9 — ref present but resolution failed → renders nothing (text-only degrade).
export const UnresolvableImage: Story = {
  decorators: [withSlideImageUrlMock({ url: null, isLoading: false })],
  args: {
    image: {
      imageId: 'img-missing',
      storagePath: 'demo/missing.png',
      width: 400,
      height: 300,
      alt: 'Missing diagram',
    },
  },
};
