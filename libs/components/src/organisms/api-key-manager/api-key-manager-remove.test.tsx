jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeyManagerRemove } from './api-key-manager-remove';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.removeConfirmHeadline': 'Remove API key?',
  'settings.apiKey.removeConfirmBody': "You'll lose access to generation.",
  'settings.apiKey.removeConfirmAction': 'Confirm removal',
  'settings.apiKey.removeConfirmCancelAction': 'Cancel',
  'general.saving': 'Saving…',
};

const t = (key: string) => tMap[key] ?? key;

describe('ApiKeyManagerRemove', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  it('renders nothing when no provider is being confirmed', async () => {
    await render(
      <ApiKeyManagerRemove
        confirmingRemove={null}
        isSubmitting={false}
        setConfirmingRemove={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.queryByText('Remove API key?')).toBeNull();
  });

  it('calls onRemove but does not close the dialog when Confirm is pressed', async () => {
    const onRemove = jest.fn();
    const setConfirmingRemove = jest.fn();
    await render(
      <ApiKeyManagerRemove
        confirmingRemove="groq"
        isSubmitting={false}
        setConfirmingRemove={setConfirmingRemove}
        onRemove={onRemove}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Confirm removal' }));

    expect(onRemove).toHaveBeenCalledWith('groq');
    // The caller drives closing via isSubmitting settling, not an eager close here.
    expect(setConfirmingRemove).not.toHaveBeenCalled();
  });

  it('closes when Cancel is pressed', async () => {
    const setConfirmingRemove = jest.fn();
    await render(
      <ApiKeyManagerRemove
        confirmingRemove="groq"
        isSubmitting={false}
        setConfirmingRemove={setConfirmingRemove}
        onRemove={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(setConfirmingRemove).toHaveBeenCalledWith(null);
  });

  it('shows the submitting indicator instead of the confirm body while removing', async () => {
    await render(
      <ApiKeyManagerRemove
        confirmingRemove="groq"
        isSubmitting
        setConfirmingRemove={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByText("You'll lose access to generation.")).toBeNull();
  });
});
