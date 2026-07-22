import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from './chip';

describe('Chip', () => {
  it('renders the label', async () => {
    await render(<Chip label="Filters" />);

    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('calls onPress and exposes selected state for filter chips', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Math" type="filter" selected onPress={onPress} />);

    expect(screen.getByText('Math')).toBeTruthy();
    const chip = screen.getByRole('button');
    expect(chip.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true, disabled: false }),
    );

    fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove with an accessible remove control', async () => {
    const onRemove = jest.fn();
    await render(<Chip label="Tag" onRemove={onRemove} />);

    fireEvent.press(screen.getByLabelText('Remove Tag'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
