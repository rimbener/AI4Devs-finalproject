import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { layout, lightColors, spacing } from '../../theme';
import { DesktopBar } from './desktop-bar';

const baseProps = {
  brandLabel: 'AI Study Buddy',
  avatar: <Text>HL</Text>,
  home: { label: 'Home', onPress: jest.fn() },
};

describe('DesktopBar', () => {
  // @s3 — wide web desktop bar: My lessons only; no New lesson / Settings destinations.
  it('renders the desktop brand, My lessons only, visual alerts, and avatar slot', async () => {
    await render(<DesktopBar {...baseProps} />);

    expect(screen.getByText('AI Study Buddy')).toBeOnTheScreen();
    expect(screen.getByText('AI Study Buddy').props.style).toMatchObject({
      color: lightColors.onSurface,
      fontSize: expect.any(Number),
    });
    expect(screen.getByRole('link', { name: 'Home' })).toBeOnTheScreen();
    // Exactly one primary destination — New lesson / Settings are not bar items (@s3).
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'New lesson' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(screen.getByTestId('desktop-alerts', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Alerts' })).toBeNull();
    expect(screen.getByText('HL')).toBeOnTheScreen();
  });

  it('hides the decorative alerts cluster from assistive technology', async () => {
    await render(<DesktopBar {...baseProps} />);

    const alerts = screen.getByTestId('desktop-alerts', { includeHiddenElements: true });
    expect(alerts.props.accessibilityElementsHidden).toBe(true);
    expect(alerts.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('uses tokenized desktop layout for brand, navigation, and actions', async () => {
    await render(<DesktopBar {...baseProps} />);

    const root = screen.getByText('AI Study Buddy').parent?.parent;
    expect(root?.props.style).toMatchObject({
      alignItems: 'center',
      backgroundColor: lightColors.surface,
      flexDirection: 'row',
      gap: spacing.s4,
      minHeight: layout.touchTarget,
    });
    expect(screen.getByText('AI Study Buddy').parent?.props.style).toMatchObject({
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.s2,
    });
    expect(screen.getByRole('link', { name: 'Home' }).parent?.props.style).toMatchObject({
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.s1,
    });
    expect(
      screen.getByTestId('desktop-alerts', { includeHiddenElements: true }).parent?.props.style,
    ).toMatchObject({
      alignItems: 'center',
      flexDirection: 'row',
      marginLeft: 'auto',
    });
  });

  it('forwards Home presses to its injected handler', async () => {
    const onHomePress = jest.fn();

    await render(<DesktopBar {...baseProps} home={{ label: 'Home', onPress: onHomePress }} />);

    fireEvent.press(screen.getByRole('link', { name: 'Home' }));

    expect(onHomePress).toHaveBeenCalledTimes(1);
  });
});
