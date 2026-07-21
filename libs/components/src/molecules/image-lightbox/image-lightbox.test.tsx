import { fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { layout } from '../../theme/spacing';
import { ImageLightbox } from './image-lightbox';
import { focusDialog } from './image-lightbox.helpers';

jest.mock('../../atoms/icon-button/icon-button', () => {
  const React = require('react');
  const { Pressable } = require('react-native');

  return {
    IconButton: ({ icon: _icon, ...props }: { icon: string }) =>
      React.createElement(Pressable, { ...props, testID: 'image-lightbox-icon-button' }),
  };
});

describe('ImageLightbox', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows a contained image in a fullscreen modal', async () => {
    const { getByLabelText } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );

    const image = getByLabelText('Photosynthesis diagram');

    expect(image).toHaveProp('resizeMode', 'contain');
    expect(image.props.style).toMatchObject({ width: '100%', height: '100%' });
  });

  // Review — the fullscreen viewer is a named dialog and receives focus when opened.
  it('exposes a named dialog and moves accessibility focus into it when opened', async () => {
    const sendAccessibilityEvent = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );

    const dialog = getByTestId('image-lightbox-content');
    expect(dialog).toHaveProp('role', 'dialog');
    expect(dialog).toHaveProp('accessibilityLabel', 'Image viewer');

    await fireEvent(getByTestId('image-lightbox-modal'), 'show');

    expect(sendAccessibilityEvent).toHaveBeenCalledWith(expect.anything(), 'focus');
  });

  it('does not focus when the dialog node is not mounted', async () => {
    const sendAccessibilityEvent = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation((node) => {
        if (!node) throw new Error('A dialog node is required to focus it.');
      });

    sendAccessibilityEvent.mockClear();
    focusDialog({ current: null });

    expect(sendAccessibilityEvent).not.toHaveBeenCalled();
  });

  // RN Web — AccessibilityInfo.sendAccessibilityEvent is missing; must not throw.
  it('falls back to host.focus when sendAccessibilityEvent is unavailable', () => {
    const focus = jest.fn();
    const original = AccessibilityInfo.sendAccessibilityEvent;
    Object.defineProperty(AccessibilityInfo, 'sendAccessibilityEvent', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    try {
      expect(() => focusDialog({ current: { focus } as never })).not.toThrow();
      expect(focus).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(AccessibilityInfo, 'sendAccessibilityEvent', {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });

  it('dismisses when the close control is pressed', async () => {
    const onRequestClose = jest.fn();

    const { getByLabelText } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={onRequestClose}
      />,
    );

    await fireEvent.press(getByLabelText('Close image'));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  // Review — close control keeps a 48dp, solid contrast boundary over arbitrary images.
  it('renders a 48dp filled close control', async () => {
    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );

    const closeButton = getByTestId('image-lightbox-icon-button');
    expect(closeButton.props.size).toBe(layout.touchTarget);
    expect(closeButton.props.variant).toBe('filled');
  });

  it('dismisses when the backdrop is pressed without closing from image presses', async () => {
    const onRequestClose = jest.fn();

    const { getByLabelText, getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={onRequestClose}
      />,
    );

    await fireEvent.press(getByLabelText('Photosynthesis diagram'));
    expect(onRequestClose).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId('image-lightbox-backdrop'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the modal scrim, content, and close control positioned', async () => {
    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );

    expect(getByTestId('image-lightbox-backdrop').props.style).toMatchObject({
      flex: 1,
      padding: expect.anything(),
      backgroundColor: expect.anything(),
    });
    expect(getByTestId('image-lightbox-content').props.style).toMatchObject({ flex: 1 });
    expect(getByTestId('image-lightbox-close-control').props.style).toMatchObject({
      position: 'absolute',
      top: expect.anything(),
      right: expect.anything(),
    });
  });

  it('stops image-area presses from reaching the backdrop', async () => {
    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );
    const stopPropagation = jest.fn();

    await fireEvent(getByTestId('image-lightbox-content'), 'press', { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the system requests closing the modal', async () => {
    const onRequestClose = jest.fn();

    const { getByTestId } = await render(
      <ImageLightbox
        visible
        source={{ uri: 'https://example.com/diagram.png' }}
        alt="Photosynthesis diagram"
        closeLabel="Close image"
        dialogLabel="Image viewer"
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
        dialogLabel="Image viewer"
        onRequestClose={jest.fn()}
      />,
    );

    expect(queryByLabelText('Photosynthesis diagram')).not.toBeOnTheScreen();
  });
});
