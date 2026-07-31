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
