jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useApiKey: jest.fn(),
  useProfile: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useApiKey, useProfile } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import type { ApiKeyStatus } from '@helsoft/types';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { ApiKeyGate } from './api-key-gate';

const mockUseApiKey = useApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

const CanCreateProbe = () => {
  const { profile } = useProfile();
  return <Text>{profile?.canCreate ? 'creation enabled' : 'creation disabled'}</Text>;
};

const emptyStatus: ApiKeyStatus = { keys: [] };
const groqStatus: ApiKeyStatus = {
  keys: [{ provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' }],
};

const apiKeyValue = (overrides: Partial<ReturnType<typeof useApiKey>> = {}) => ({
  status: emptyStatus,
  isLoading: false,
  isSubmitting: false,
  hasKey: false,
  error: null,
  saveApiKey: jest.fn(),
  removeApiKey: jest.fn(),
  ...overrides,
});

const profileValue = (overrides: Partial<ReturnType<typeof useProfile>> = {}) => ({
  profile: {
    plan: 'free' as const,
    keySource: 'user' as const,
    showKeySettings: true,
    showAds: true,
    canCreate: false,
  },
  isLoading: false,
  error: null,
  retry: jest.fn(),
  ...overrides,
});

describe('ApiKeyGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUseApiKey.mockReturnValue(apiKeyValue());
    mockUseProfile.mockReturnValue(profileValue());
  });

  it('handles unresolved non-loading entitlements as unavailable', async () => {
    mockUseProfile.mockReturnValue(profileValue({ profile: null }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
  });

  it('exposes canCreate=true via useProfile when creation is available', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: {
          plan: 'paid',
          keySource: 'platform',
          showKeySettings: false,
          showAds: false,
          canCreate: true,
        },
      }),
    );

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation enabled')).toBeTruthy();
    expect(screen.queryByText('creation disabled')).toBeNull();
  });

  // @s10 (guard facet) — notice when gated; children remain for open/play (@s13).
  it('renders the cannot-create message when there is no key', async () => {
    mockUseApiKey.mockReturnValue(apiKeyValue({ status: emptyStatus, hasKey: false }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
  });

  // @s10 — once a key is saved, the gate renders its children instead of the notice.
  it('renders children when a key is saved', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: {
          plan: 'free',
          keySource: 'user',
          showKeySettings: true,
          showAds: true,
          canCreate: true,
        },
      }),
    );

    await render(
      <ApiKeyGate>
        <Text>generation content</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('generation content')).toBeTruthy();
    expect(screen.queryByText('upload.cannotCreate')).toBeNull();
  });

  // @s9/@s17 — paid creation uses the platform key and bypasses the user-key gate.
  it('renders children for a paid learner without a saved user key', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: {
          plan: 'paid',
          keySource: 'platform',
          showKeySettings: false,
          showAds: false,
          canCreate: true,
        },
      }),
    );

    await render(
      <ApiKeyGate>
        <Text>generation content</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('generation content')).toBeTruthy();
    expect(screen.queryByText('upload.cannotCreate')).toBeNull();
  });

  // @s12 — reloaded entitlements are authoritative after a downgrade.
  it('disables create via useProfile when current entitlements disallow creation', async () => {
    mockUseApiKey.mockReturnValue(
      apiKeyValue({
        status: groqStatus,
        hasKey: true,
      }),
    );

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
  });

  // @s5/@s6 — an entitlement fetch failure (root `_layout.tsx` already gates the fatal case
  // full-screen) just leaves `canCreate` falsy here, so children stay mounted behind the
  // same cannot-create messaging as any other unavailable-creation state (@s13).
  it('falls back to the cannot-create message when entitlements fail, keeping children mounted', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({
        profile: null,
        error: new Error('profile missing'),
      }),
    );

    await render(
      <ApiKeyGate>
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
  });

  // @s13 — context consumers preserve lesson access while creation stays gated.
  it('exposes canCreate=false via useProfile while creation is unavailable', async () => {
    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.queryByText('creation enabled')).toBeNull();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
  });

  it('exposes canCreate=false via useProfile while entitlements load', async () => {
    mockUseProfile.mockReturnValue(profileValue({ profile: null, isLoading: true }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.queryByText('creation enabled')).toBeNull();
  });

  it('exposes canCreate=false via useProfile when entitlements fail', async () => {
    mockUseProfile.mockReturnValue(
      profileValue({ profile: null, error: new Error('read failed') }),
    );

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.queryByText('creation enabled')).toBeNull();
  });
});
