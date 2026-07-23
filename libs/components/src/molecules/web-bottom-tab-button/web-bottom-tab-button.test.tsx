import { render, screen } from '@testing-library/react-native';

import { WebBottomTabButton } from './web-bottom-tab-button';

describe('WebBottomTabButton', () => {
  it('exposes selected accessibility state when focused', async () => {
    await render(<WebBottomTabButton icon="settings" isFocused label="Settings" />);
    expect(screen.getByRole('tab', { selected: true })).toBeTruthy();
  });

  it('does not claim selected when unfocused', async () => {
    await render(<WebBottomTabButton icon="menu_book" label="My lessons" />);
    expect(screen.getByRole('tab', { selected: false })).toBeTruthy();
  });

  it('renders the label text', async () => {
    await render(<WebBottomTabButton icon="settings" label="Settings" />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });
});
