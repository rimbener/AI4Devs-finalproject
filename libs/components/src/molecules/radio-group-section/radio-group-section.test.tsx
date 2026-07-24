import { fireEvent, render, screen } from '@testing-library/react-native';

import { RadioGroupSection } from './radio-group-section';

const options = [
  { value: 'short', label: 'Short lesson' },
  { value: 'standard', label: 'Standard lesson' },
  { value: 'deep', label: 'Deep dive' },
];

describe('RadioGroupSection', () => {
  it('renders the title and all options with the selected value checked', async () => {
    await render(
      <RadioGroupSection
        title="Lesson length"
        options={options}
        value="standard"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Lesson length')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Short lesson' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Standard lesson', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Deep dive' })).toBeTruthy();
  });

  it('calls onChange with the chosen option value', async () => {
    const onChange = jest.fn();
    await render(
      <RadioGroupSection
        title="Lesson length"
        options={options}
        value="standard"
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByRole('radio', { name: 'Deep dive' }));

    expect(onChange).toHaveBeenCalledWith('deep');
  });

  it('disables all options when disabled is true', async () => {
    await render(
      <RadioGroupSection
        title="Lesson length"
        options={options}
        value="standard"
        onChange={jest.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('radio', { name: 'Standard lesson', disabled: true })).toBeTruthy();
  });

  // Defaults the radiogroup accessible name to `title` so assistive tech announces the section.
  it('uses title as the radiogroup accessibilityLabel by default', async () => {
    await render(
      <RadioGroupSection
        title="Lesson length"
        options={options}
        value="standard"
        onChange={jest.fn()}
      />,
    );

    const group = screen.getByLabelText('Lesson length');
    expect(group.props.accessibilityRole).toBe('radiogroup');
  });

  it('prefers an explicit accessibilityLabel over title for the radiogroup', async () => {
    await render(
      <RadioGroupSection
        title="Lesson length"
        options={options}
        value="standard"
        onChange={jest.fn()}
        accessibilityLabel="Choose length"
      />,
    );

    const group = screen.getByLabelText('Choose length');
    expect(group.props.accessibilityRole).toBe('radiogroup');
    expect(screen.queryByLabelText('Lesson length')).toBeNull();
  });
});
