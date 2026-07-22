jest.mock('@helsoft/services', () => ({
  LocalePreferenceService: {
    getStoredLocale: jest.fn(),
    setStoredLocale: jest.fn(),
  },
}));

import { LocalePreferenceService } from '@helsoft/services';
import { renderHook } from '@testing-library/react';

import { useLocalePreference } from './use-locale-preference';

const service = LocalePreferenceService as jest.Mocked<typeof LocalePreferenceService>;

describe('useLocalePreference', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates getStoredLocale to the service', async () => {
    service.getStoredLocale.mockResolvedValue('es');
    const { result } = renderHook(() => useLocalePreference());

    await expect(result.current.getStoredLocale()).resolves.toBe('es');
    expect(service.getStoredLocale).toHaveBeenCalledWith();
  });

  it('delegates setStoredLocale to the service', async () => {
    service.setStoredLocale.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLocalePreference());

    await result.current.setStoredLocale('de');
    expect(service.setStoredLocale).toHaveBeenCalledWith('de');
  });
});
