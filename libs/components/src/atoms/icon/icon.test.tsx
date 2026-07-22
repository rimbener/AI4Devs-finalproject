import { render, screen } from '@testing-library/react-native';

import { Icon } from './icon';

describe('Icon', () => {
  it('renders the Material Symbols ligature name', async () => {
    await render(<Icon name="upload_file" />);

    expect(screen.getByText('upload_file')).toBeTruthy();
  });

  it('applies size and color to the glyph', async () => {
    await render(<Icon name="close" size={18} color="#ff0000" />);

    expect(screen.getByText('close').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 18, lineHeight: 18, color: '#ff0000' }),
      ]),
    );
  });
});
