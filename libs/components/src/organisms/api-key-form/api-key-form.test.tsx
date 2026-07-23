jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { SavedProviderKey } from '@helsoft/types';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Linking } from 'react-native';

import { lightColors } from '../../theme/colors';
import { shape } from '../../theme/shape';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ApiKeyForm, LOADING_STATUS_TEST_ID } from './api-key-form';

const mockUseLocalization = useLocalization as jest.Mock;

const labels = {
  inputLabel: 'API key',
  save: 'Save',
  saving: 'Saving…',
  loadingStatus: 'Checking your API key status…',
  replace: 'Replace',
  remove: 'Remove',
  keySavedStatus: 'Groq key saved · Updated Jan 1, 2026',
  guidance: "Don't have a key? Get one from Groq",
  removeConfirmHeadline: 'Remove API key?',
  removeConfirmBody: "You'll need to add a new key to generate lessons again.",
  removeConfirmAction: 'Confirm removal',
  removeConfirmCancelAction: 'Cancel',
};

const t = (key: string) => {
  const map: Record<string, string> = {
    'settings.apiKey.inputLabel': labels.inputLabel,
    'settings.apiKey.save': labels.save,
    'settings.apiKey.saving': labels.saving,
    'settings.apiKey.loadingStatus': labels.loadingStatus,
    'settings.apiKey.replace': labels.replace,
    'settings.apiKey.remove': labels.remove,
    'settings.apiKey.guidance': labels.guidance,
    'settings.apiKey.removeConfirmHeadline': labels.removeConfirmHeadline,
    'settings.apiKey.removeConfirmBody': labels.removeConfirmBody,
    'settings.apiKey.removeConfirmAction': labels.removeConfirmAction,
    'settings.apiKey.removeConfirmCancelAction': labels.removeConfirmCancelAction,
  };
  return map[key] ?? key;
};

const noKey: null = null;
const savedKey: SavedProviderKey = {
  provider: 'groq',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const guidanceUrl = 'https://example.com/get-a-key';

describe('ApiKeyForm', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
  });

  // @s1 — with no key saved, the input is rendered (labelled) alongside Save.
  it('renders a labelled secure input and the Save control when no key is saved', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByLabelText('API key')).toBeTruthy();
    expect(screen.getByLabelText('API key').props.secureTextEntry).toBe(true);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  // @s5 — the Empty state's Save control is disabled until a non-blank key is entered.
  it('disables Save until a non-blank key is entered in the Empty state', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });

    expect(screen.getByRole('button', { name: 'Save', disabled: false })).toBeTruthy();
  });

  // @s5 — a whitespace-only key never enables Save.
  it('keeps Save disabled when the entered key is whitespace-only', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), '   ');
    });

    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();
  });

  // @s5 — the Empty state shows guidance on where to get a key.
  it('renders a guidance link to where to get a key in the Empty state', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByRole('button', { name: labels.guidance })).toBeTruthy();
  });

  it('hides the guidance link when replacing an existing saved key', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: labels.replace }));
    });

    expect(screen.queryByRole('button', { name: labels.guidance })).toBeNull();
    expect(screen.getByLabelText(labels.inputLabel)).toBeTruthy();
  });

  it('requests the input label via the settings.apiKey.inputLabel i18n key', async () => {
    const t = jest.fn((key: string) => (key === 'settings.apiKey.inputLabel' ? labels.inputLabel : key));
    mockUseLocalization.mockReturnValue({ t });

    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(t).toHaveBeenCalledWith('settings.apiKey.inputLabel');
  });

  // Full-review Round 1, Minor 13 (WCAG 1.3.2) — guidance before input before Save.
  it('renders the guidance link before the input in the Empty state', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    const tree = JSON.stringify(screen.toJSON());
    const order = [labels.guidance, labels.inputLabel, labels.save].map((text) =>
      tree.indexOf(`"${text}"`),
    );

    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  // Full-review Round 1, Minor 8 — guidanceUrl comes from the prop.
  it('opens the injected guidanceUrl prop when the guidance link is pressed', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: labels.guidance }));

    expect(openURL).toHaveBeenCalledWith(guidanceUrl);
    openURL.mockRestore();
  });

  // Guidance link rejection must not become an unhandled promise rejection.
  it('does not leave a rejected Linking.openURL promise unhandled when the guidance link is pressed', async () => {
    const unhandledRejectionSpy = jest.fn();
    process.on('unhandledRejection', unhandledRejectionSpy);
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error("can't open url"));

    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: labels.guidance }));
    });
    await act(async () => {
      await new Promise<void>((resolve) => setImmediate(() => resolve()));
    });

    process.off('unhandledRejection', unhandledRejectionSpy);
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(unhandledRejectionSpy).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  // @s1 — onSave receives the typed value.
  it('calls onSave with the entered key when Save is pressed', async () => {
    const onSave = jest.fn();
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={onSave}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('sk-test-key');
  });

  // @s1 — given a saved key, the masked "key saved" state renders.
  it('renders the masked key-saved state and no input when a key is saved', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText('Groq key saved · Updated Jan 1, 2026')).toBeTruthy();
    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
  });

  // @s1 — raw key value never resurfaces once masked state is shown.
  it('never renders the raw key value once the masked state is shown', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-super-secret-key');
    });
    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={savedKey}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(screen.queryByText('sk-super-secret-key')).toBeNull();
    expect(screen.queryByDisplayValue('sk-super-secret-key')).toBeNull();
  });

  // task-7 Loading state.
  it('renders a loading placeholder and no controls while isLoadingStatus', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isLoadingStatus
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByTestId(LOADING_STATUS_TEST_ID)).toBeTruthy();
    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('renders the loading placeholder under the literal api-key-form-loading-status test id', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isLoadingStatus
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByTestId('api-key-form-loading-status')).toBeTruthy();
  });

  // Full-review Round 1, Major 4 (WCAG 4.1.3) — polite live-region alongside loading spinner.
  it('renders a polite live-region signal alongside the status-loading placeholder', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isLoadingStatus
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText(labels.loadingStatus).props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces the status-loading state via AccessibilityInfo when isLoadingStatus becomes true', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    expect(announceSpy).not.toHaveBeenCalled();

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          isLoadingStatus
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    await waitFor(() => expect(announceSpy).toHaveBeenCalledWith(labels.loadingStatus));
    announceSpy.mockRestore();
  });

  // @s2 — while a save is in flight, input and Save are disabled.
  it('disables the input and Save control and shows a progress label while isSubmitting', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isSubmitting
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByLabelText('API key').props.editable).toBe(false);
    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();
    expect(screen.getByText('Saving…')).toBeTruthy();
  });

  // WCAG 4.1.2 — accessibilityState.disabled tracks isSubmitting.
  it('exposes accessibilityState.disabled on the input matching isSubmitting', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    expect(screen.getByLabelText('API key').props.accessibilityState).toEqual({ disabled: false });

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          isSubmitting
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(screen.getByLabelText('API key').props.accessibilityState).toEqual({ disabled: true });
  });

  // Full-review Round 1, Major 4 (WCAG 4.1.3) — saving progress label is a polite live region.
  it('marks the saving progress label as a polite live region', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isSubmitting
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText(labels.saving).props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces the saving progress via AccessibilityInfo when isSubmitting becomes true', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    expect(announceSpy).not.toHaveBeenCalled();

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          isSubmitting
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    await waitFor(() => expect(announceSpy).toHaveBeenCalledWith(labels.saving));
    announceSpy.mockRestore();
  });

  // @s2 — outside isSubmitting, no progress label, Save enabled.
  it('shows no progress label and keeps Save enabled outside of isSubmitting', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test-key');
    });

    expect(screen.queryByText('Saving…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Save', disabled: false })).toBeTruthy();
  });

  // @s4 — pressing Replace reveals the input again.
  it('reveals the input when Replace is pressed and submits the new key via onSave', async () => {
    const onSave = jest.fn();
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={onSave}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace' }));
    });

    expect(screen.getByLabelText('API key')).toBeTruthy();
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-replacement-key');
    });
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('sk-replacement-key');
  });

  // Full-review Round 1, Major 2 — failed first save keeps typed key in field.
  it('keeps the typed key in the field after a failed first (non-Replace) save resolves', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-typed-key');
    });

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          isSubmitting
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });
    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          isSubmitting={false}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(screen.getByLabelText('API key').props.value).toBe('sk-typed-key');
  });

  // Mutation Round 2 — key becoming available without a submission must not clear the field.
  it('does not clear the typed key when savedKey flips from null without ever having submitted', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-typed-key');
    });

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={savedKey}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace' }));
    });

    expect(screen.getByLabelText('API key').props.value).toBe('sk-typed-key');
  });

  // @s4 — replace-save success reverts to masked state.
  it('reverts to the masked state after a replace-save resolves successfully', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace' }));
    });
    expect(screen.getByLabelText('API key')).toBeTruthy();
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-replacement-key');
    });

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={savedKey}
          isSubmitting
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });
    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={savedKey}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.getByText('Groq key saved · Updated Jan 1, 2026')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Replace' }));
    });

    expect(screen.getByLabelText('API key').props.value).toBe('');
  });

  // spec.md:76 — isSubmitting disables Replace/Remove on the masked state too.
  it('disables Replace and Remove and shows a progress label while isSubmitting on the masked saved state', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        isSubmitting
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByRole('button', { name: 'Replace', disabled: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove', disabled: true })).toBeTruthy();
    expect(screen.getByText('Saving…')).toBeTruthy();
  });

  // Error banner in Empty state keeps input editable.
  it('renders an errorMessage banner in the Empty state and keeps the input editable', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="Couldn't reach the server."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText("Couldn't reach the server.")).toBeTruthy();
    expect(screen.getByLabelText('API key').props.editable).toBe(true);
    expect(screen.queryByText('Groq key saved · Updated Jan 1, 2026')).toBeNull();
  });

  // No errorMessage means no banner.
  it('renders no error banner when errorMessage is absent', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });

  // @s14/AC12 — error announced via AccessibilityInfo.
  it('announces the error banner via AccessibilityInfo when errorMessage is set', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="That key didn't validate."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(announceSpy).toHaveBeenCalledWith("That key didn't validate.");
    announceSpy.mockRestore();
  });

  // @s14/AC12 — distinct error re-announced.
  it('announces the error banner again when errorMessage changes to a different value', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});
    announceSpy.mockClear();

    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="That key didn't validate."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    expect(announceSpy).toHaveBeenCalledWith("That key didn't validate.");
    announceSpy.mockClear();

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={noKey}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          errorMessage="Couldn't reach the server. Try again."
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(announceSpy).toHaveBeenCalledWith("Couldn't reach the server. Try again.");
    announceSpy.mockRestore();
  });

  // @s7 — retried save success shows masked state.
  it('shows the masked saved state once a retried save succeeds after a network_error', async () => {
    const { rerender } = await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="Couldn't reach the server. Try again."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );
    expect(screen.getByText("Couldn't reach the server. Try again.")).toBeTruthy();

    await act(async () => {
      rerender(
        <ApiKeyForm
          savedKey={savedKey}
          onSave={jest.fn()}
          guidanceUrl={guidanceUrl}
          keySavedStatusLabel={labels.keySavedStatus}
        />,
      );
    });

    expect(screen.queryByText("Couldn't reach the server. Try again.")).toBeNull();
    expect(screen.getByText('Groq key saved · Updated Jan 1, 2026')).toBeTruthy();
  });

  // @s9 — error banner alongside masked saved state.
  it('renders an errorMessage banner alongside the masked saved state', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="Couldn't remove the key."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText("Couldn't remove the key.")).toBeTruthy();
    expect(screen.getByText('Groq key saved · Updated Jan 1, 2026')).toBeTruthy();
  });

  // Mutation Round 2 — confirmation dialog starts closed.
  it('renders with the removal confirmation dialog closed', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        onRemove={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.queryByText(labels.removeConfirmHeadline)).toBeNull();
  });

  // Remove opens confirmation dialog without calling onRemove.
  it('opens a confirmation dialog when Remove is pressed, without calling onRemove yet', async () => {
    const onRemove = jest.fn();
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        onRemove={onRemove}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    });

    expect(screen.getByText(labels.removeConfirmHeadline)).toBeTruthy();
    expect(screen.getByText(labels.removeConfirmBody)).toBeTruthy();
    expect(onRemove).not.toHaveBeenCalled();
  });

  // @s8 — confirming dialog calls onRemove.
  it('calls onRemove when the removal is confirmed in the dialog', async () => {
    const onRemove = jest.fn();
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        onRemove={onRemove}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: labels.removeConfirmAction }));
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  // Mutation Round 2 — confirming closes the dialog.
  it('closes the confirmation dialog after the removal is confirmed', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        onRemove={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: labels.removeConfirmAction }));
    });

    expect(screen.queryByText(labels.removeConfirmHeadline)).toBeNull();
  });

  // Mutation Round 2 — optional onRemove: no crash when not supplied.
  it('does not crash confirming a removal when onRemove is not supplied', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    });

    await expect(
      act(async () => {
        fireEvent.press(screen.getByRole('button', { name: labels.removeConfirmAction }));
      }),
    ).resolves.not.toThrow();
  });

  // @s8 — cancelling keeps the key.
  it('does not call onRemove when the confirmation is dismissed', async () => {
    const onRemove = jest.fn();
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        onRemove={onRemove}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Remove' }));
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: labels.removeConfirmCancelAction }));
    });

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByText(labels.removeConfirmHeadline)).toBeNull();
  });

  // Mutation Round 2 — StyleSheet assertions.
  it('stacks the form contents with the standard vertical gap', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    const form = screen.getByRole('button', { name: 'Save' }).parent?.parent;

    expect(form).toHaveStyle({ gap: spacing.s4 });
  });

  it('lays out the actions row as a horizontally centered row with the standard gap', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    const actionsRow = screen.getByRole('button', { name: 'Save' }).parent;

    expect(actionsRow).toHaveStyle({ flexDirection: 'row', alignItems: 'center', gap: spacing.s3 });
  });

  it('renders the masked key-saved status with the standard body typography and neutral color', async () => {
    await render(
      <ApiKeyForm
        savedKey={savedKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText('Groq key saved · Updated Jan 1, 2026')).toHaveStyle({
      ...typography.bodyMedium,
      color: lightColors.onSurfaceVariant,
    });
  });

  it('renders the error banner with the error-container background, radius, and padding', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="That key didn't validate."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText("That key didn't validate.").parent).toHaveStyle({
      backgroundColor: lightColors.errorContainer,
      borderRadius: shape.card,
      padding: spacing.s3,
    });
  });

  it('renders the error banner text with the standard body typography and onErrorContainer color', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        errorMessage="That key didn't validate."
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText("That key didn't validate.")).toHaveStyle({
      ...typography.bodyMedium,
      color: lightColors.onErrorContainer,
    });
  });

  it('keeps the loading-status live-region text visually hidden but mounted', async () => {
    await render(
      <ApiKeyForm
        savedKey={noKey}
        isLoadingStatus
        onSave={jest.fn()}
        guidanceUrl={guidanceUrl}
        keySavedStatusLabel={labels.keySavedStatus}
      />,
    );

    expect(screen.getByText(labels.loadingStatus)).toHaveStyle({
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
    });
  });
});
