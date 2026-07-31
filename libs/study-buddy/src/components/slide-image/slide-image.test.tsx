jest.mock('@helsoft/activities', () => ({
  SlideImage: ({
    image,
    layout,
  }: {
    image?: { imageId?: string; alt?: string };
    layout?: string;
  }) => {
    const { Text } = require('react-native');
    return (
      <Text testID="organism-slide-image">{`${image?.imageId ?? 'none'}|${layout ?? 'none'}`}</Text>
    );
  },
}));

import type { SlideImageRef } from '@helsoft/types';
import { render, screen } from '@testing-library/react-native';

import { SlideImage } from './slide-image';

const imageRef: SlideImageRef = {
  imageId: 'img-1',
  storagePath: 'user/doc/img.png',
  width: 400,
  height: 200,
  alt: 'Diagram of mitosis',
};

describe('SlideImage', () => {
  it('forwards image to the SlideImage organism', async () => {
    await render(<SlideImage image={imageRef} />);

    expect(screen.getByTestId('organism-slide-image').props.children).toBe('img-1|none');
  });

  it('forwards layout to the SlideImage organism', async () => {
    await render(<SlideImage image={imageRef} layout="split" />);

    expect(screen.getByTestId('organism-slide-image').props.children).toBe('img-1|split');
  });
});
