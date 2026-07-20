jest.mock('@helsoft/hooks', () => ({
  useSlideImageUrl: jest.fn(),
  useInteractionState: () => ({
    hover: false,
    press: false,
    handlers: {},
  }),
}));

jest.mock('@helsoft/localization', () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

import { lightTheme } from '@helsoft/components/theme';
import { useSlideImageUrl } from '@helsoft/hooks';
import type { SlideImageRef } from '@helsoft/types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { SlideImage } from './slide-image';

const mockUseSlideImageUrl = useSlideImageUrl as jest.Mock;

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const imageRef: SlideImageRef = {
  imageId: 'img-1',
  storagePath: 'user/doc/img.png',
  width: 400,
  height: 200,
  alt: 'Diagram of mitosis',
};

describe('SlideImage', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s4 — no image → render nothing and no expand control.
  it('renders nothing when there is no image', async () => {
    mockUseSlideImageUrl.mockReturnValue({ url: null, isLoading: false });

    await render(<SlideImage image={undefined} />);

    expect(screen.queryByLabelText('Diagram of mitosis')).toBeNull();
    expect(screen.queryByRole('button', { name: 'player.slideImage.expand' })).toBeNull();
    expect(screen.queryByTestId('image-lightbox-modal')).toBeNull();
  });

  // @s5 — unresolved URLs render no image, control, or openable lightbox.
  it('renders nothing when the image ref fails to resolve', async () => {
    mockUseSlideImageUrl.mockReturnValue({ url: null, isLoading: false });

    await render(<SlideImage image={imageRef} />);

    expect(screen.queryByLabelText('Diagram of mitosis')).toBeNull();
    expect(screen.queryByText(/error/i)).toBeNull();
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.queryByRole('button', { name: 'player.slideImage.expand' })).toBeNull();
    expect(screen.queryByTestId('image-lightbox-modal')).toBeNull();
  });

  // @s2 — narrow slides preserve full-width scaling without overflow.
  it('renders the image scaled to fit when a url is available', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);

    const image = screen.getByLabelText('Diagram of mitosis');
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: 'https://example.com/signed.png' });
    expect(image.props.style).toEqual(
      expect.objectContaining({
        width: '100%',
        aspectRatio: 2,
      }),
    );
  });

  // @s1, @s3 — wide slides constrain the image and its expand overlay together.
  it('caps and centers the image with its expand overlay at the readable content width', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);

    expect(screen.getByTestId('slide-image-wrapper').props.style).toEqual(
      expect.objectContaining({
        width: '100%',
        maxWidth: lightTheme.layout.contentReading,
        position: 'relative',
      }),
    );
    expect(screen.getByTestId('slide-image-container').props.style).toEqual(
      expect.objectContaining({ alignItems: 'center' }),
    );
  });

  // @s3, @s10 — signed URLs expose a localized dedicated expand control.
  it('shows a localized expand control when the image url is ready', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);

    expect(screen.getByRole('button', { name: 'player.slideImage.expand' })).toBeTruthy();
  });

  // Review — expand control keeps a 48dp, solid contrast boundary over arbitrary images.
  it('renders a 48dp filled expand control', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);

    const style = flattenStyle(
      screen.getByRole('button', { name: 'player.slideImage.expand' }).props.style,
    );
    expect(style.width).toBe(lightTheme.layout.touchTarget);
    expect(style.height).toBe(lightTheme.layout.touchTarget);
  });

  it('keeps the expand control positioned over the image', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);

    expect(screen.getByTestId('slide-image-expand-control').props.style).toMatchObject({
      position: 'absolute',
      top: expect.anything(),
      right: expect.anything(),
    });
  });

  // @s6, @s11 — expand opens the contained lightbox with a localized close control.
  it('opens and closes the lightbox from the image controls', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);
    await fireEvent.press(screen.getByRole('button', { name: 'player.slideImage.expand' }));

    expect(screen.getByTestId('image-lightbox-modal')).toBeTruthy();
    expect(screen.getByLabelText('player.slideImage.close')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('player.slideImage.close'));

    expect(screen.queryByTestId('image-lightbox-modal')).toBeNull();
  });

  // Review — closing the lightbox restores accessibility focus to its trigger.
  it('restores accessibility focus to the expand control when the lightbox closes', async () => {
    const sendAccessibilityEvent = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);
    await fireEvent.press(screen.getByRole('button', { name: 'player.slideImage.expand' }));
    await fireEvent.press(screen.getByLabelText('player.slideImage.close'));

    expect(sendAccessibilityEvent).toHaveBeenCalledTimes(1);
    const focusTarget = sendAccessibilityEvent.mock.calls[0]?.[0] as unknown as {
      props: { testID?: string };
    };
    expect(focusTarget.props.testID).toBe('slide-image-expand-focus-target');
    expect(sendAccessibilityEvent.mock.calls[0]?.[1]).toBe('focus');
  });

  it('passes the resolved URL and source alt to the lightbox image', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={imageRef} />);
    await fireEvent.press(screen.getByRole('button', { name: 'player.slideImage.expand' }));

    const lightboxImage = screen.getByTestId('image-lightbox-image');
    expect(lightboxImage.props.source).toEqual({ uri: 'https://example.com/signed.png' });
    expect(lightboxImage.props.accessibilityLabel).toBe('Diagram of mitosis');
  });

  it('keeps a missing alt decorative in the lightbox', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={{ ...imageRef, alt: undefined }} />);
    await fireEvent.press(screen.getByRole('button', { name: 'player.slideImage.expand' }));

    expect(screen.getByTestId('image-lightbox-image').props.accessibilityLabel).toBeUndefined();
  });

  // Mutation — aspectRatio falls back to 1 unless BOTH width and height are > 0.
  it('falls back to aspect ratio 1 when width or height is non-positive', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={{ ...imageRef, width: 0, height: 200, alt: 'zero-width' }} />);
    expect(screen.getByLabelText('zero-width').props.style).toEqual(
      expect.objectContaining({ aspectRatio: 1 }),
    );

    await render(<SlideImage image={{ ...imageRef, width: 200, height: 0, alt: 'zero-height' }} />);
    expect(screen.getByLabelText('zero-height').props.style).toEqual(
      expect.objectContaining({ aspectRatio: 1 }),
    );
  });

  // Review r2 — missing alt → decorative (no empty accessible name). WCAG 1.1.1 / 4.1.2.
  it('marks the image decorative when alt is missing', async () => {
    mockUseSlideImageUrl.mockReturnValue({
      url: 'https://example.com/signed.png',
      isLoading: false,
    });

    await render(<SlideImage image={{ ...imageRef, alt: undefined }} />);

    const image = screen.getByTestId('slide-image');
    expect(image.props.accessible).toBe(false);
    expect(image.props.accessibilityLabel).toBeUndefined();
  });
});
