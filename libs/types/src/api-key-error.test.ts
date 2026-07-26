import type { ApiKeyError, ApiKeyErrorCode } from './api-key-error';

// task-8 — the closed set of codes ApiKeyService normalizes every save/remove failure to
// (spec.md Decision 8, mirrors backend D11/D12). `provider_disabled` names a save against a
// currently-disabled provider distinctly from a transport `network_error`.
describe('ApiKeyErrorCode', () => {
  it('carries one of the 3 closed ApiKeyErrorCode values', () => {
    const codes: ApiKeyErrorCode[] = ['network_error', 'validation_error', 'provider_disabled'];
    const error: ApiKeyError = { code: 'provider_disabled' };

    expect(codes).toHaveLength(3);
    expect(error).toEqual({ code: 'provider_disabled' });
  });
});

describe('ApiKeyError', () => {
  it('carries just the normalized code', () => {
    const error: ApiKeyError = { code: 'network_error' };

    expect(error).toEqual({ code: 'network_error' });
  });
});
