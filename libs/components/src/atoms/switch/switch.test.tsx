import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from './switch';

describe('Switch', () => {
  it('renders a labeled switch and toggles via onChange', async () => {
    const onChange = jest.fn();
    await render(<Switch label="Dark mode" checked={false} onChange={onChange} />);

    const toggle = screen.getByRole('switch', { name: 'Dark mode' });
    expect(toggle.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false, disabled: false }),
    );

    fireEvent.press(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects checked and disabled accessibility state', async () => {
    await render(<Switch checked disabled label="Locked" />);

    expect(screen.getByRole('switch').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true, disabled: true }),
    );
    expect(screen.getByText('Locked')).toBeTruthy();
  });
});
