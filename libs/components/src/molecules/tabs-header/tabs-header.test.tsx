import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../../atoms/button/button';

import { TabsHeader } from './tabs-header';

describe('TabsHeader', () => {
  it('renders the title as a header', async () => {
    await render(<TabsHeader title="Saved lessons" />);

    expect(screen.getByRole('header', { name: 'Saved lessons' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders trailing children and wires presses', async () => {
    const onPress = jest.fn();
    await render(
      <TabsHeader title="PDF files">
        <Button onPress={onPress}>New lesson</Button>
      </TabsHeader>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'New lesson' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
