import type { AiProvider } from './ai-provider';

/**
 * The **only** thing the client ever learns about a saved key (spec.md "No key material in
 * the client contract"). Provider + timestamp only — no key characters, no last-4 hint.
 */
export type SavedProviderKey = {
  provider: AiProvider;
  updatedAt: string;
};

/**
 * Multi-provider key status: the ordered list of saved provider keys for the authenticated user.
 * Empty array = no keys saved. The client never learns key material — only provider + timestamp.
 */
export type ApiKeyStatus = {
  keys: SavedProviderKey[];
};

/** Parameters for `ApiKeyService.saveApiKey` / `ApiKeyDao.saveApiKey`. */
export type SaveApiKeyParams = {
  provider: AiProvider;
  apiKey: string;
};

/**
 * Compile-time shape lock (@s9): `SavedProviderKey` may only ever carry provider + timestamp —
 * never key material. A `keyof` equality check resolves to `never` the moment a future edit
 * adds any key-shaped field (e.g. `key`, `lastFour`, `apiKey`), causing `pnpm check-types` to
 * fail rather than silently compiling.
 */
type AssertExactKeys<T, Keys extends string> = keyof T extends Keys
  ? Keys extends keyof T
    ? true
    : never
  : never;
const _savedProviderKeyShapeLock: AssertExactKeys<SavedProviderKey, 'provider' | 'updatedAt'> =
  true;
void _savedProviderKeyShapeLock;
