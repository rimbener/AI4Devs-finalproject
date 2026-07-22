import { fireEvent, render, screen } from '@testing-library/react-native';

import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders a labeled checkbox and toggles via onChange', async () => {
    const onChange = jest.fn();
    await render(<Checkbox label="Remember me" checked={false} onChange={onChange} />);

    expect(screen.getByText('Remember me')).toBeTruthy();
    const box = screen.getByRole('checkbox');
    expect(box.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false, disabled: false }),
    );

    fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('exposes mixed state when indeterminate', async () => {
    await render(<Checkbox indeterminate label="Partial" />);

    expect(screen.getByText('Partial')).toBeTruthy();
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe('mixed');
  });
});
