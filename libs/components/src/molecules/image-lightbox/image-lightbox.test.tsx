import { fireEvent, render } from '@testing-library/react-native';

import { ImageLightbox } from './image-lightbox';

describe('ImageLightbox', () => {
  it('shows a contained image in a fullscreen modal', async () => {
    const { getByLabelText } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        onRequestClose={jest.fn()}
      />,
    );

    const image = getByLabelText('Photosynthesis diagram');

    expect(image).toHaveProp('resizeMode', 'contain');
    expect(image.props.style).toMatchObject({ width: '100%', height: '100%' });
  });

  it('dismisses when the close control is pressed', async () => {
    const onRequestClose = jest.fn();

    const { getByLabelText } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        onRequestClose={onRequestClose}
      />,
    );

    await fireEvent.press(getByLabelText('Close image'));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the backdrop is pressed without closing from image presses', async () => {
    const onRequestClose = jest.fn();

    const { getByLabelText, getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        onRequestClose={onRequestClose}
      />,
    );

    await fireEvent.press(getByLabelText('Photosynthesis diagram'));
    expect(onRequestClose).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId('image-lightbox-backdrop'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the system requests closing the modal', async () => {
    const onRequestClose = jest.fn();

    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        onRequestClose={onRequestClose}
      />,
    );

    await fireEvent(getByTestId('image-lightbox-modal'), 'requestClose');

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('does not render its content while controlled as hidden', async () => {
    const { queryByLabelText } = await render(
      <ImageLightbox
        visible={false}
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        onRequestClose={jest.fn()}
      />,
    );

    expect(queryByLabelText('Photosynthesis diagram')).not.toBeOnTheScreen();
  });
});
