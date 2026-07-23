import type { AiProvider } from '@helsoft/types';

import { useApiKeyInitialState, useApiKeyReducer } from './use-api-key.reducer';

const keysStatus = (providers: AiProvider[]) => ({
  keys: providers.map((provider) => ({
    provider,
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
});

describe('useApiKeyReducer', () => {
  it('starts with isSubmitting false', () => {
    expect(useApiKeyInitialState.isSubmitting).toBe(false);
  });

  it('clears isSubmitting after a successful mutation', () => {
    const afterStart = useApiKeyReducer(useApiKeyInitialState, { type: 'mutation/start' });
    expect(afterStart.isSubmitting).toBe(true);

    const afterSuccess = useApiKeyReducer(afterStart, {
      type: 'mutation/success',
      status: keysStatus(['groq']),
    });

    expect(afterSuccess.isSubmitting).toBe(false);
    expect(afterSuccess.error).toBeNull();
  });

  it('clears isSubmitting after a failed mutation', () => {
    const afterStart = useApiKeyReducer(useApiKeyInitialState, { type: 'mutation/start' });

    const afterFailure = useApiKeyReducer(afterStart, {
      type: 'mutation/failure',
      error: 'network_error',
    });

    expect(afterFailure.isSubmitting).toBe(false);
    expect(afterFailure.error).toBe('network_error');
  });
});
