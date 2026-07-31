import { getApiKeyErrorMessageKey } from './use-api-key.helpers';

// Mutation coverage — the exact i18n key per ApiKeyErrorCode (@s7/@s9, task-8's @s16).
describe('getApiKeyErrorMessageKey', () => {
  it('maps network_error to error.network', () => {
    expect(getApiKeyErrorMessageKey('network_error')).toBe('error.network');
  });

  it('maps validation_error to settings.apiKey.error.empty', () => {
    expect(getApiKeyErrorMessageKey('validation_error')).toBe('settings.apiKey.error.empty');
  });

  it('maps provider_disabled to settings.apiKey.error.providerDisabled', () => {
    expect(getApiKeyErrorMessageKey('provider_disabled')).toBe(
      'settings.apiKey.error.providerDisabled',
    );
  });

  it('resolves to undefined for null/undefined (no error)', () => {
    expect(getApiKeyErrorMessageKey(null)).toBeUndefined();
    expect(getApiKeyErrorMessageKey(undefined)).toBeUndefined();
  });
});
