jest.mock('@helsoft/localization', () => ({ useLocalization: jest.fn() }));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { padding, shape, spacing } from '../../theme';
import { Dialog } from './dialog';

const mockUseLocalization = useLocalization as jest.Mock;

describe('Dialog', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({
      t: (key: string) =>
        key === 'general.confirm' ? 'Confirm' : key === 'general.cancel' ? 'Cancel' : key,
    });
  });

  it('renders headline, body, and default actions when open', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <Dialog open headline="Delete lesson?" onClose={onClose} onConfirm={onConfirm}>
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByText('Delete lesson?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();

    await fireEvent.press(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('hides content when closed', async () => {
    await render(
      <Dialog open={false} headline="Hidden">
        Body
      </Dialog>,
    );

    expect(screen.queryByText('Hidden')).toBeNull();
  });

  // Mutation: `onPress={(e) => e.stopPropagation()}` on the surface Pressable (dialog.tsx:33) —
  // without it, a press anywhere on the dialog surface would bubble to the scrim's own onPress
  // and dismiss the dialog while the user is interacting with its content.
  it('stops propagation on the surface so pressing the dialog content never reaches the scrim', async () => {
    const onClose = jest.fn();
    await render(
      <Dialog open headline="Delete lesson?" onClose={onClose}>
        This cannot be undone.
      </Dialog>,
    );

    const stopPropagation = jest.fn();
    await fireEvent(screen.getByTestId('dialog-surface'), 'press', { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  // Mutation: `actions ?? (...)` (dialog.tsx:44) — a caller-provided `actions` node must fully
  // replace the default Cancel/Confirm button row (CardListWithABMDialogDialog relies on this to
  // show a single Close button on error and no buttons at all while submitting).
  it('replaces the default Cancel/Confirm buttons with a caller-provided actions node', async () => {
    await render(
      <Dialog open headline="Delete lesson?" actions={<Text>Custom actions</Text>}>
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByText('Custom actions')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.queryByText('Confirm')).toBeNull();
  });

  // Mutation: `disabled={confirmDisabled}` (dialog.tsx:49) on the default Confirm button.
  it('disables the default Confirm button when confirmDisabled is true', async () => {
    await render(
      <Dialog open headline="Delete lesson?" confirmDisabled>
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByRole('button', { name: 'Confirm' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });

  // Mutation: `typeof children === 'string'` (dialog.tsx:42) — a non-string `children` node must
  // be rendered as-is (direct child of the surface), never re-wrapped in the `styles.body` Text.
  it('renders non-string children directly, without wrapping them in the body Text', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        <Text testID="custom-child">Custom body node</Text>
      </Dialog>,
    );

    expect(screen.getByTestId('custom-child').parent).toBe(screen.getByTestId('dialog-surface'));
  });

  // Mutation: `styles.body` (dialog.tsx's StyleSheet) — a string `children` node is wrapped in a
  // Text styled from the theme, not left unstyled.
  it('styles string children with a theme color', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByText('This cannot be undone.').props.style).toMatchObject({
      color: expect.any(String),
    });
  });

  // Mutation: `styles.headline(!!icon)`'s `centered` ternary (dialog.tsx's StyleSheet) — the
  // headline is centered only when an icon is present, left-aligned otherwise.
  it('left-aligns the headline when there is no icon', async () => {
    await render(<Dialog open headline="Delete lesson?" />);

    expect(screen.getByText('Delete lesson?').props.style).toMatchObject({ textAlign: 'left' });
  });

  it('centers the headline when an icon is present', async () => {
    await render(<Dialog open headline="Lesson ready!" icon="auto_awesome" />);

    expect(screen.getByText('Lesson ready!').props.style).toMatchObject({ textAlign: 'center' });
  });

  // Mutation: `styles.iconWrap` — the icon sits in a centered wrapper above the headline.
  it('centers the icon in its wrapper', async () => {
    await render(<Dialog open headline="Lesson ready!" icon="auto_awesome" />);

    expect(screen.getByText('auto_awesome').parent?.props.style).toMatchObject({
      alignItems: 'center',
    });
  });

  // Mutation: `style={[styles.surface, style]}` (dialog.tsx:34) — a caller-provided `style` must
  // be merged with, not replace, the surface's own MD3 layout (a `[]` mutant drops both).
  it('merges a caller-provided style with the surface layout', async () => {
    await render(
      <Dialog open headline="Delete lesson?" style={{ marginTop: 12 }}>
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByTestId('dialog-surface').props.style).toMatchObject([
      {
        width: '100%',
        maxWidth: 420,
        borderRadius: shape.dialog,
        padding: padding.dialog,
        cursor: 'auto',
      },
      { marginTop: 12 },
    ]);
  });

  // Mutation: `styles.scrim` — full-bleed, centered scrim behind the surface.
  it('centers the surface within a full-flex scrim', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByTestId('dialog-scrim').props.style).toMatchObject({
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: padding.dialog,
    });
  });

  // Mutation: `styles.actions` — the action row lays its buttons out end-aligned.
  it('right-aligns the default action row', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByTestId('dialog-actions').props.style).toMatchObject({
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.s2,
    });
  });

  // Mutation: `onClose={dialogState === 'submitting' ? undefined : onClose}` at the
  // CardListWithABMDialogDialog call site relies on this organism tolerating an `undefined`
  // onClose — pressing the scrim must not throw when dismissal is intentionally disabled.
  it('does not throw when the scrim is pressed with no onClose handler', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        This cannot be undone.
      </Dialog>,
    );

    await expect(fireEvent.press(screen.getByTestId('dialog-scrim'))).resolves.not.toThrow();
  });

  // Mutation: `testID = 'dialog'` default param (dialog.tsx:25) — omitting `testID` must still
  // produce the exact `dialog-scrim`/`dialog-surface`/`dialog-actions` literals every existing
  // consumer relies on.
  it('defaults the scrim/surface/actions testIDs to the `dialog` prefix when testID is omitted', async () => {
    await render(
      <Dialog open headline="Delete lesson?">
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByTestId('dialog-scrim')).toBeTruthy();
    expect(screen.getByTestId('dialog-surface')).toBeTruthy();
    expect(screen.getByTestId('dialog-actions')).toBeTruthy();
  });

  // Mutation: `` `${testID}-scrim/surface/actions` `` template literals (dialog.tsx:31,36,45) — a
  // caller-provided `testID` must fully replace the `dialog` prefix on all three nodes.
  it('prefixes the scrim/surface/actions testIDs with a caller-provided testID', async () => {
    await render(
      <Dialog open headline="Delete lesson?" testID="custom">
        This cannot be undone.
      </Dialog>,
    );

    expect(screen.getByTestId('custom-scrim')).toBeTruthy();
    expect(screen.getByTestId('custom-surface')).toBeTruthy();
    expect(screen.getByTestId('custom-actions')).toBeTruthy();
  });
});
