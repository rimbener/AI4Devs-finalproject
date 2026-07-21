jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('../slide-image/slide-image', () => ({
  SlideImage: ({ layout }: { layout?: 'stacked' | 'split' }) => {
    const { Text } = require('react-native');
    return <Text testID={`slide-image-${layout ?? 'stacked'}`}>{layout ?? 'stacked'}</Text>;
  },
}));

import type { InstructionalSlide } from '@helsoft/types';
import { render, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';

import { SlideView } from './slide-view';

const landscapeImageSlide: InstructionalSlide = {
  id: 'slide-1',
  lessonId: 'lesson-1',
  title: 'Photosynthesis',
  content: 'Plants convert light into energy.',
  position: 0,
  kind: 'instructional',
  image: {
    imageId: 'image-1',
    storagePath: 'slides/image-1.png',
    width: 800,
    height: 400,
  },
};

describe('SlideView layout integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // @s1 — SlideView composes real viewport-derived layout into the split tree for any image.
  it('renders the split tree for a measured landscape image on a wide viewport', async () => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 1024,
      height: 768,
      scale: 1,
      fontScale: 1,
    });

    await render(<SlideView slide={landscapeImageSlide} availableHeight={600} />);

    expect(screen.getByTestId('slide-split-row')).toBeTruthy();
    expect(screen.getByTestId('slide-image-split')).toBeTruthy();
    expect(screen.getByTestId('slide-body-scroll')).toBeTruthy();
  });
});
