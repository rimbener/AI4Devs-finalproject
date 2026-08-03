jest.mock('./use-get-api-key', () => ({ useGetApiKey: jest.fn() }));
jest.mock('./use-profile', () => ({ useProfile: jest.fn() }));

import { renderHook } from '@testing-library/react-native';

import { useCanCreate } from './use-can-create';
import { useGetApiKey } from './use-get-api-key';
import { useProfile } from './use-profile';

const mockUseGetApiKey = useGetApiKey as jest.Mock;
const mockUseProfile = useProfile as jest.Mock;

const platformPlan = {
  plan: 'paid',
  keySource: 'platform',
  showKeySettings: false,
  showAds: false,
} as const;
const userPlan = {
  plan: 'free',
  keySource: 'user',
  showKeySettings: true,
  showAds: true,
} as const;

describe('useCanCreate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfile.mockReturnValue({ profile: userPlan });
    mockUseGetApiKey.mockReturnValue({ hasKey: false });
  });

  // DRY anchor — the derivation is `keySource === 'platform' || hasKey`, composed here once.
  it('enables creation for a platform-key plan without a saved user key', () => {
    mockUseProfile.mockReturnValue({ profile: platformPlan });

    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(true);
  });

  it('enables creation for a platform-key plan with a saved user key', () => {
    mockUseProfile.mockReturnValue({ profile: platformPlan });
    mockUseGetApiKey.mockReturnValue({ hasKey: true });

    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(true);
  });

  it('enables creation for a free learner with a saved user key', () => {
    mockUseGetApiKey.mockReturnValue({ hasKey: true });

    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(true);
  });

  it('disables creation for a free learner without a saved user key', () => {
    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(false);
  });

  // A still-loading/errored profile reads as null: hasKey alone still grants creation.
  it('disables creation while the profile is unresolved and no key is saved', () => {
    mockUseProfile.mockReturnValue({ profile: null });

    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(false);
  });

  it('enables creation from a saved key even while the profile is unresolved', () => {
    mockUseProfile.mockReturnValue({ profile: null });
    mockUseGetApiKey.mockReturnValue({ hasKey: true });

    const { result } = renderHook(() => useCanCreate());

    expect(result.current.canCreate).toBe(true);
  });

  it('composes both source hooks on every render', () => {
    renderHook(() => useCanCreate());

    expect(mockUseProfile).toHaveBeenCalledTimes(1);
    expect(mockUseGetApiKey).toHaveBeenCalledTimes(1);
  });
});
