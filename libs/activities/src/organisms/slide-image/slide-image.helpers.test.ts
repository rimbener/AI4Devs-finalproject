import { getContainedImageSize } from './slide-image.helpers';

describe('getContainedImageSize', () => {
  it('fits a wide image to pane width', () => {
    expect(getContainedImageSize(2, { width: 200, height: 100 })).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('fits a tall image to pane height', () => {
    expect(getContainedImageSize(0.5, { width: 200, height: 100 })).toEqual({
      width: 50,
      height: 100,
    });
  });
});
