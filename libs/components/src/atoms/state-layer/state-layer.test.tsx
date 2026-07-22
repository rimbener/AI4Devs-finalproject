import { render, screen } from '@testing-library/react-native';

import { StateLayer } from './state-layer';

describe('StateLayer', () => {
  it('renders an absolute wash with the given opacity and color', async () => {
    await render(<StateLayer testID="wash" opacity={0.12} color="#112233" />);

    const layer = screen.getByTestId('wash');
    expect(layer.props.pointerEvents).toBe('none');
    expect(layer.props.style).toEqual(
      expect.objectContaining({
        position: 'absolute',
        opacity: 0.12,
        backgroundColor: '#112233',
      }),
    );
  });

  it('falls back to theme onSurface when color is omitted', async () => {
    await render(<StateLayer testID="wash" opacity={0} />);

    expect(screen.getByTestId('wash').props.style).toEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
        opacity: 0,
      }),
    );
  });
});
