// SubmittingIndicator (rendered while dialogState is "submitting") calls useLocalization, and
// the default Dialog actions fall back to t('general.cancel')/t('general.save') — mock it as the
// rest of this lib's dialog tests do.
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { CardListItem } from '../../card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from '../../hooks/card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from '../../hooks/card-list-with-abm-dialog.context.types';
import { CardListWithABMDialogDialog } from './card-list-with-abm-dialog-dialog';

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: <Text>Card content</Text>,
  accessibleLabel: 'Card',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'first' },
};

/** Full required context value with sensible test defaults; pass `overrides` per test. */
const makeContextValue = (
  overrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
): CardListWithABMDialogValue<StoryItem> => ({
  title: 'My List',
  items: [item],
  addButtonLabel: 'Add item',
  renderAddForm: () => <Text>Add form</Text>,
  addDialogTitle: 'Add card',
  renderEditForm: (i) => <Text>{`Edit form for ${i.id}`}</Text>,
  editDialogTitle: 'Edit card',
  renderRemoveConfirmation: (i) => <Text>{`Remove ${i.id}?`}</Text>,
  getEditAccessibilityLabel: (i) => `Edit ${i.accessibleLabel}`,
  getRemoveAccessibilityLabel: (i) => `Remove ${i.accessibleLabel}`,
  isSubmitting: false,
  ...overrides,
});

type DialogProps = Parameters<typeof CardListWithABMDialogDialog<StoryItem>>[0];

const renderDialog = (
  props: Partial<DialogProps> = {},
  contextOverrides: Partial<CardListWithABMDialogValue<StoryItem>> = {},
) =>
  render(
    <CardListWithABMDialogProvider value={makeContextValue(contextOverrides)}>
      <CardListWithABMDialogDialog<StoryItem>
        open
        dialogType={null}
        dialogState={null}
        dialogItem={null}
        {...props}
      />
    </CardListWithABMDialogProvider>,
  );

const mockUseLocalization = useLocalization as jest.Mock;

describe('CardListWithABMDialogDialog', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t: (key: string) => key });
  });

  it('hides the dialog content when open is false', async () => {
    await renderDialog({ open: false, dialogType: 'add', dialogState: 'open', title: 'Add card' });

    expect(screen.queryByText('Add card')).toBeNull();
    expect(screen.queryByText('Add form')).toBeNull();
  });

  it('renders renderAddForm() when dialogType is "add"', async () => {
    await renderDialog({ dialogType: 'add', dialogState: 'open', title: 'Add card' });

    expect(screen.getByText('Add card')).toBeTruthy();
    expect(screen.getByText('Add form')).toBeTruthy();
  });

  it('renders renderEditForm(dialogItem) when dialogType is "edit" and dialogItem is set', async () => {
    await renderDialog({
      dialogType: 'edit',
      dialogState: 'open',
      dialogItem: item,
      title: 'Edit card',
    });

    expect(screen.getByText('Edit card')).toBeTruthy();
    expect(screen.getByText('Edit form for item-1')).toBeTruthy();
  });

  it('renders nothing in the body when dialogType is "edit" and dialogItem is null', async () => {
    await renderDialog({ dialogType: 'edit', dialogState: 'open', dialogItem: null });

    expect(screen.queryByText(/^Edit form for/)).toBeNull();
  });

  it('renders renderRemoveConfirmation(dialogItem) when dialogType is "remove" and dialogItem is set', async () => {
    await renderDialog({
      dialogType: 'remove',
      dialogState: 'open',
      dialogItem: item,
      title: 'Remove card',
    });

    expect(screen.getByText('Remove card')).toBeTruthy();
    expect(screen.getByText('Remove item-1?')).toBeTruthy();
  });

  it('renders nothing in the body when dialogType is "remove" and dialogItem is null', async () => {
    await renderDialog({ dialogType: 'remove', dialogState: 'open', dialogItem: null });

    expect(screen.queryByText(/^Remove item/)).toBeNull();
  });

  it('replaces the body with ErrorBanner and hides the form when errorMessage is set', async () => {
    await renderDialog({
      dialogType: 'edit',
      dialogState: 'open',
      dialogItem: item,
      errorMessage: 'Could not save this item.',
    });

    expect(screen.getByText('Could not save this item.')).toBeTruthy();
    expect(screen.queryByText('Edit form for item-1')).toBeNull();
  });

  it('replaces the default actions with a single Close button when errorMessage is set', async () => {
    const onClose = jest.fn();
    await renderDialog({
      dialogType: 'edit',
      dialogState: 'open',
      dialogItem: item,
      errorMessage: 'Could not save this item.',
      onClose,
    });

    expect(screen.queryByText('general.cancel')).toBeNull();
    expect(screen.queryByText('general.save')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('general.close'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('replaces the body with SubmittingIndicator and hides the default actions while submitting', async () => {
    await renderDialog({ dialogType: 'edit', dialogState: 'submitting', dialogItem: item });

    expect(screen.getByText('general.saving')).toBeTruthy();
    expect(screen.queryByText('Edit form for item-1')).toBeNull();
    expect(screen.queryByText('general.cancel')).toBeNull();
    expect(screen.queryByText('general.save')).toBeNull();
  });

  it('hides the default actions once the dialog has closed', async () => {
    await renderDialog({ dialogType: 'edit', dialogState: 'closed', dialogItem: item });

    expect(screen.getByText('Edit form for item-1')).toBeTruthy();
    expect(screen.queryByText('general.cancel')).toBeNull();
    expect(screen.queryByText('general.save')).toBeNull();
  });

  it('shows default cancel/submit actions that call onClose/onSubmit while open', async () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();
    await renderDialog({
      dialogType: 'edit',
      dialogState: 'open',
      dialogItem: item,
      onClose,
      onSubmit,
      submitLabel: 'Save',
      cancelLabel: 'Cancel',
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.press(screen.getByText('Cancel'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to localized default labels when submitLabel/cancelLabel are omitted', async () => {
    await renderDialog({ dialogType: 'edit', dialogState: 'open', dialogItem: item });

    expect(screen.getByText('general.cancel')).toBeTruthy();
    expect(screen.getByText('general.save')).toBeTruthy();
  });

  it('disables the submit button when submitDisabled is true', async () => {
    await renderDialog({
      dialogType: 'edit',
      dialogState: 'open',
      dialogItem: item,
      submitLabel: 'Save',
      submitDisabled: true,
    });

    expect(screen.getByRole('button', { name: 'Save' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });
});
