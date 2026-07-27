jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useLocalization } from '@helsoft/localization';
import type { AiProvider } from '@helsoft/types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect, useRef } from 'react';
import { Linking, TextInput } from 'react-native';

import { ApiKeyFormDialog } from './api-key-form-dialog';
import type { ApiKeyFormDialogProps } from './api-key-form-dialog.types';

const mockUseLocalization = useLocalization as jest.Mock;

const tMap: Record<string, string> = {
  'settings.apiKey.inputLabel': 'API key',
  'general.save': 'Save',
  'general.saving': 'Saving…',
  'settings.apiKey.replace': 'Replace',
  'settings.apiKey.removeConfirmCancelAction': 'Cancel',
  'settings.apiKey.manager.addNew': 'Add new provider',
  'settings.apiKey.manager.selectProvider': 'Select provider',
};

type TOptions = Record<string, unknown>;
const t = (key: string, opts?: TOptions) => {
  if (key === 'settings.apiKey.guidanceTemplate' && opts) {
    return `Don't have a key? Get one from ${opts.provider}`;
  }
  return tMap[key] ?? key;
};

const providerNames: Record<AiProvider, string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
};

// Canonical catalog order, mirrored from `providerNames` above — replaces the deleted hardcoded
// provider-id constant (task-11).
const ALL_PROVIDERS = Object.keys(providerNames) as AiProvider[];

const guidanceUrls: Partial<Record<AiProvider, string>> = {
  groq: 'https://console.groq.com/keys',
};

const defaultProps: ApiKeyFormDialogProps = {
  open: true,
  onClose: jest.fn(),
  formMode: 'add',
  formProvider: null,
  unsavedProviders: ALL_PROVIDERS,
  apiKey: '',
  onApiKeyChange: jest.fn(),
  onSelectProvider: jest.fn(),
  isSaveDisabled: true,
  onSave: jest.fn(),
  guidanceUrls,
  providerNames,
};

// Shared spy for the TextInput host's imperative `focus()`, obtained from a throwaway instance
// (RN's TextInput ref resolves to a native host class whose prototype is shared across every
// instance) — mirrors the working probe in `focus-probe.test.tsx`.
let focusSpy: jest.SpyInstance;

const ProbeTextInput = () => {
  const ref = useRef<TextInput>(null);
  useEffect(() => {
    (globalThis as { __probeTextInput?: TextInput }).__probeTextInput = ref.current ?? undefined;
  });
  return <TextInput ref={ref} />;
};

beforeAll(async () => {
  await render(<ProbeTextInput />);
  const instance = (globalThis as { __probeTextInput?: TextInput }).__probeTextInput;
  focusSpy = jest.spyOn(Object.getPrototypeOf(instance), 'focus');
});

afterAll(() => {
  focusSpy.mockRestore();
});

describe('ApiKeyFormDialog', () => {
  beforeEach(() => {
    mockUseLocalization.mockReturnValue({ t });
    focusSpy.mockClear();
  });

  it('renders nothing interactive when closed', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} open={false} />);

    expect(screen.queryByLabelText('API key')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('shows provider radios and Save/Cancel in add mode', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} />);

    expect(screen.getByRole('radio', { name: 'Groq' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save', disabled: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('calls onSelectProvider when a radio is pressed', async () => {
    const onSelectProvider = jest.fn();
    await render(<ApiKeyFormDialog {...defaultProps} onSelectProvider={onSelectProvider} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('radio', { name: 'OpenAI' }));
    });

    expect(onSelectProvider).toHaveBeenCalledWith('openai');
  });

  it('calls onApiKeyChange when the key field changes', async () => {
    const onApiKeyChange = jest.fn();
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formProvider="groq"
        onApiKeyChange={onApiKeyChange}
        isSaveDisabled
      />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('API key'), 'sk-test');
    });

    expect(onApiKeyChange).toHaveBeenCalledWith('sk-test');
  });

  it('calls onSave when Save is enabled and pressed', async () => {
    const onSave = jest.fn();
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formProvider="groq"
        apiKey="sk-test"
        isSaveDisabled={false}
        onSave={onSave}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel is pressed', async () => {
    const onClose = jest.fn();
    await render(<ApiKeyFormDialog {...defaultProps} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows fixed provider label and no radios in replace mode', async () => {
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formMode="replace"
        formProvider="groq"
        unsavedProviders={[]}
      />,
    );

    expect(screen.getByText('Groq')).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByLabelText('API key')).toBeTruthy();
  });

  it('shows saving label and hides the form while submitting', async () => {
    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formMode="replace"
        formProvider="groq"
        apiKey="sk-draft"
        isSubmitting
        isSaveDisabled
      />,
    );

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByLabelText('API key')).toBeNull();
  });

  it('shows guidance link and opens the URL for the selected provider', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }));
    });

    expect(openURL).toHaveBeenCalledWith('https://console.groq.com/keys');
    openURL.mockRestore();
  });

  it('lists only the unsavedProviders passed in', async () => {
    await render(<ApiKeyFormDialog {...defaultProps} unsavedProviders={['openai', 'anthropic']} />);

    expect(screen.queryByRole('radio', { name: 'Groq' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'OpenAI' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Anthropic' })).toBeTruthy();
  });

  // `useEffect(() => { if (formProvider && textFieldRef.current) { textFieldRef.current.focus(); } }, [formProvider])`
  describe('focus effect on formProvider', () => {
    it('focuses the API key field on mount when a formProvider is already set', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(focusSpy).toHaveBeenCalled();
    });

    it('does not focus the API key field on mount when there is no formProvider', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider={null} />);

      expect(focusSpy).not.toHaveBeenCalled();
    });

    // Proves the `[formProvider]` dependency array matters: with an empty array the effect
    // would only ever run once on mount and never re-fire for this later selection.
    it('focuses the API key field when formProvider changes from null to set after mount', async () => {
      const view = await render(<ApiKeyFormDialog {...defaultProps} formProvider={null} />);
      expect(focusSpy).not.toHaveBeenCalled();

      await view.rerender(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  // `formMode === 'replace' && formProvider ? \`${t('...replace')} ${providerLabel(formProvider)}\` : t('...addNew')`
  describe('dialog headline', () => {
    it('shows "Replace <provider>" in replace mode with a formProvider set', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="replace" formProvider="groq" />);

      expect(screen.getByText('Replace Groq')).toBeTruthy();
      expect(screen.queryByText('Add new provider')).toBeNull();
    });

    // formMode is 'replace' but formProvider is falsy — falls through to the add-new headline,
    // proving the `&&` isn't collapsed to just `formMode === 'replace'`.
    it('falls back to the add-new headline in replace mode without a formProvider', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="replace" formProvider={null} />);

      expect(screen.getByText('Add new provider')).toBeTruthy();
      expect(screen.queryByText(/^Replace /)).toBeNull();
    });

    it('shows the add-new headline in add mode', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="add" formProvider={null} />);

      expect(screen.getByText('Add new provider')).toBeTruthy();
      expect(screen.queryByText(/^Replace /)).toBeNull();
    });

    // formMode is 'add' but formProvider happens to be set (e.g. a stale value from a prior
    // replace) — still shows the add-new headline, proving `formMode === 'replace'` isn't
    // collapsed to just a truthy check on `formProvider`.
    it('shows the add-new headline in add mode even when formProvider is set', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="add" formProvider="groq" />);

      expect(screen.getByText('Add new provider')).toBeTruthy();
      expect(screen.queryByText(/^Replace /)).toBeNull();
    });
  });

  // `disabled={isSubmitting || !formProvider}` on the API key TextField.
  describe('API key field disabled state', () => {
    it('is disabled when isSubmitting is false but formProvider is unset', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider={null} />);

      expect(screen.getByLabelText('API key').props.editable).toBe(false);
    });

    it('is disabled when formProvider is set but isSubmitting is true', async () => {
      await render(
        <ApiKeyFormDialog {...defaultProps} formMode="replace" formProvider="groq" isSubmitting />,
      );

      // isSubmitting hides the field entirely (SubmittingIndicator branch), so this exercises
      // the `||` independently via accessibilityState instead of the (unmounted) TextInput.
      expect(screen.queryByLabelText('API key')).toBeNull();
      expect(screen.getByText('Saving…')).toBeTruthy();
    });

    it('is enabled when isSubmitting is false and formProvider is set', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(screen.getByLabelText('API key').props.editable).toBe(true);
    });

    // `accessibilityLabel={t('settings.apiKey.inputLabel')}` — asserted on the prop directly
    // (not just via the `getByLabelText` query, which could otherwise resolve through the
    // sibling `label` Text instead of this exact accessibilityLabel value).
    it('sets the exact translated accessibilityLabel on the API key input', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(screen.getByLabelText('API key').props.accessibilityLabel).toBe('API key');
    });

    // `label={t('settings.apiKey.inputLabel')}` — a separate, visible `<Text>` rendered by
    // TextField alongside the input, distinct from the `accessibilityLabel` prop above. An
    // emptied translation key would drop this visible label entirely without affecting
    // accessibilityLabel, so it needs its own assertion.
    it('renders the visible "API key" label text next to the input', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(screen.getByText('API key')).toBeTruthy();
    });

    // `accessibilityState={{ disabled: isSubmitting }}` — the field only renders in the
    // non-submitting branch, so isSubmitting is always false there; an emptied object would
    // drop the `disabled` key entirely instead of explicitly carrying `false`.
    it('carries an explicit accessibilityState.disabled: false while the field is visible', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

      expect(screen.getByLabelText('API key').props.accessibilityState).toEqual({
        disabled: false,
      });
    });
  });

  // `formMode === 'add' ? <RadioGroup/> : formProvider ? <Text>{providerLabel}</Text> : null`
  // Note: `getByRole('radiogroup')` throws on this markup (the container isn't `accessible`),
  // same as documented in `radio-group.test.tsx` — the group is queried by its accessible label.
  describe('provider picker vs. fixed label', () => {
    it('renders the RadioGroup in add mode', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="add" />);

      expect(screen.getByLabelText('Select provider')).toBeTruthy();
      expect(screen.getByRole('radio', { name: 'Groq' })).toBeTruthy();
    });

    it('renders the fixed provider label (not the radio group) in replace mode with formProvider', async () => {
      await render(
        <ApiKeyFormDialog
          {...defaultProps}
          formMode="replace"
          formProvider="groq"
          unsavedProviders={[]}
        />,
      );

      expect(screen.queryByLabelText('Select provider')).toBeNull();
      expect(screen.getByText('Groq')).toBeTruthy();
    });

    it('renders neither the radio group nor a provider label in replace mode without formProvider', async () => {
      await render(
        <ApiKeyFormDialog
          {...defaultProps}
          formMode="replace"
          formProvider={null}
          unsavedProviders={[]}
        />,
      );

      expect(screen.queryByLabelText('Select provider')).toBeNull();
      expect(screen.queryByText('Groq')).toBeNull();
      expect(screen.queryByText('OpenAI')).toBeNull();
    });
  });

  // `formMode === 'add' && formProvider && guidanceUrls[formProvider] ? <Button>...` </Button> : null`
  describe('guidance link visibility', () => {
    it('shows no guidance button in add mode when the provider has no configured guidanceUrl', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="add" formProvider="openai" />);

      expect(screen.queryByRole('button', { name: /Don't have a key/ })).toBeNull();
    });

    it('shows no guidance button in replace mode even when the provider has a configured guidanceUrl', async () => {
      await render(
        <ApiKeyFormDialog
          {...defaultProps}
          formMode="replace"
          formProvider="groq"
          unsavedProviders={[]}
        />,
      );

      expect(screen.queryByRole('button', { name: /Don't have a key/ })).toBeNull();
    });

    it('shows the guidance button in add mode when the provider has a configured guidanceUrl', async () => {
      await render(<ApiKeyFormDialog {...defaultProps} formMode="add" formProvider="groq" />);

      expect(
        screen.getByRole('button', { name: "Don't have a key? Get one from Groq" }),
      ).toBeTruthy();
    });
  });

  // Mutation: emptied actionsRow/form/providerLabel StyleSheet objects and their
  // flexDirection/alignItems/flexWrap literals. Mirrors the flattenStyle pattern used elsewhere
  // in this lib (e.g. pdf-document-list.test.tsx) for killing layout-object/literal mutants.
  it('lays out the dialog actions row as a wrapping horizontal flex group with spaced content', async () => {
    const flattenStyle = (style: unknown): Record<string, unknown> =>
      Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

    await render(<ApiKeyFormDialog {...defaultProps} formProvider="groq" />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const actionsRowFlat = flattenStyle(cancelButton.parent?.props?.style);
    expect(actionsRowFlat.flexDirection).toBe('row');
    expect(actionsRowFlat.alignItems).toBe('center');
    expect(actionsRowFlat.flexWrap).toBe('wrap');
    expect(actionsRowFlat.gap).toBeTruthy();

    const input = screen.getByLabelText('API key');
    const formFlat = flattenStyle(input.parent?.parent?.parent?.props?.style);
    expect(formFlat.gap).toBeTruthy();
  });

  it('styles the fixed provider label with a theme color in replace mode', async () => {
    const flattenStyle = (style: unknown): Record<string, unknown> =>
      Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

    await render(
      <ApiKeyFormDialog
        {...defaultProps}
        formMode="replace"
        formProvider="groq"
        unsavedProviders={[]}
      />,
    );

    const providerLabelFlat = flattenStyle(screen.getByText('Groq').props.style);
    expect(providerLabelFlat.color).toBeTruthy();
  });
});
