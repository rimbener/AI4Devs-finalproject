import type { AiProvider } from '@helsoft/types';
import type { RefObject } from 'react';
import type { TextInput } from 'react-native';

const SAFE_URL_SCHEME_PATTERN = /^https?:\/\//i;

/**
 * Guards `Linking.openURL` against a catalog-sourced url (`AiProviderCatalogEntry.guidanceUrl`)
 * that isn't `http:`/`https:` (review.md's "Full review — Round 1 (post-CI-fix)", finding 8,
 * OWASP A08-adjacent). No reliance on the RN `URL` global (patchy polyfill coverage) — a scheme
 * prefix check is sufficient here.
 */
export function isSafeExternalUrl(url: string): boolean {
  return SAFE_URL_SCHEME_PATTERN.test(url);
}

/**
 * Focuses the api key field once a provider is selected (add or replace flow) — extracted so the
 * conditional focus logic is unit-testable without an imperative `TextInput.focus()` call, which
 * carries no observable signal through React Native's test renderer.
 */
export function focusApiKeyField(
  ref: RefObject<TextInput | null>,
  formProvider: AiProvider | null,
): void {
  if (formProvider && ref.current) {
    ref.current.focus();
  }
}
