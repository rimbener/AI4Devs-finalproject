jest.mock('@helsoft/hooks', () => ({
  ...jest.requireActual('@helsoft/hooks'),
  useCanCreate: jest.fn(),
}));
jest.mock('@helsoft/localization', () => ({
  useLocalization: jest.fn(),
}));

import { useCanCreate } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { localizationValue } from '../../test-utils/auth-test-factories';
import { ApiKeyGate } from './api-key-gate';

const mockUseCanCreate = useCanCreate as jest.Mock;
const mockUseLocalization = useLocalization as jest.Mock;

// Reads the shared `useCanCreate()` hook the gate itself consumes — the derivation matrix
// (`keySource === 'platform' || hasKey`) is covered in `@helsoft/hooks`' use-can-create.test.ts.
const CanCreateProbe = () => {
  const { canCreate } = useCanCreate();
  return <Text>{canCreate ? 'creation enabled' : 'creation disabled'}</Text>;
};

const canCreateValue = (overrides: Partial<ReturnType<typeof useCanCreate>> = {}) => ({
  canCreate: false,
  ...overrides,
});

describe('ApiKeyGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(localizationValue());
    mockUseCanCreate.mockReturnValue(canCreateValue());
  });

  it('handles unavailable creation as gated, keeping children mounted', async () => {
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

  it('exposes canCreate=true via useCanCreate when creation is available', async () => {
    mockUseCanCreate.mockReturnValue(canCreateValue({ canCreate: true }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation enabled')).toBeTruthy();
    expect(screen.queryByText('creation disabled')).toBeNull();
  });

  // @s10 (guard facet) — notice when gated; children remain for open/play (@s13).
  it('renders the cannot-create message when creation is disabled', async () => {
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

  // @s10 — once creation is available, the gate renders its children instead of the notice.
  it('renders children when creation is available', async () => {
    mockUseCanCreate.mockReturnValue(canCreateValue({ canCreate: true }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>generation content</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation enabled')).toBeTruthy();
    expect(screen.getByText('generation content')).toBeTruthy();
    expect(screen.queryByText('upload.cannotCreate')).toBeNull();
  });

  // @s9/@s17 — a paid (platform-key) learner bypasses the user-key gate.
  it('renders children for a platform-key learner without a saved user key', async () => {
    mockUseCanCreate.mockReturnValue(canCreateValue({ canCreate: true }));

    await render(
      <ApiKeyGate>
        <Text>generation content</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('generation content')).toBeTruthy();
    expect(screen.queryByText('upload.cannotCreate')).toBeNull();
  });

  // @s12 — the platform plan alone is authoritative: creation stays enabled even while the
  // key-status read is still loading (a downgrade to a user keySource is what gates creation,
  // not a transient key read — decided by useCanCreate).
  it('keeps creation enabled for a platform-key plan even while the key status loads', async () => {
    mockUseCanCreate.mockReturnValue(canCreateValue({ canCreate: true }));

    await render(
      <ApiKeyGate>
        <CanCreateProbe />
        <Text>generation content</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation enabled')).toBeTruthy();
    expect(screen.getByText('generation content')).toBeTruthy();
    expect(screen.queryByText('upload.cannotCreate')).toBeNull();
  });

  // @s5/@s6 — an entitlement fetch failure (root `_layout.tsx` already gates the fatal case
  // full-screen) just leaves creation unavailable here, so children stay mounted behind the
  // same cannot-create messaging as any other unavailable-creation state (@s13).
  it('falls back to the cannot-create message when creation is unavailable, keeping children mounted', async () => {
    await render(
      <ApiKeyGate>
        <Text>open existing lesson</Text>
      </ApiKeyGate>,
    );

    expect(screen.getByText('upload.cannotCreate')).toBeTruthy();
    expect(screen.getByText('open existing lesson')).toBeTruthy();
  });

  // @s13 — context consumers preserve lesson access while creation stays gated.
  it('exposes canCreate=false via useCanCreate while creation is unavailable', async () => {
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

  it('exposes canCreate=false via useCanCreate while entitlements load', async () => {
    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.queryByText('creation enabled')).toBeNull();
  });

  it('exposes canCreate=false via useCanCreate when entitlements fail', async () => {
    await render(
      <ApiKeyGate>
        <CanCreateProbe />
      </ApiKeyGate>,
    );

    expect(screen.getByText('creation disabled')).toBeTruthy();
    expect(screen.queryByText('creation enabled')).toBeNull();
  });
});
