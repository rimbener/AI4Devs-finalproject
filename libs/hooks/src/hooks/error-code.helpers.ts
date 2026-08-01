/**
 * Generic error-code normalization shared by the per-feature helpers
 * (lessons, pdf-documents, api-key): one cast-and-Set dance instead of a copy per domain.
 */
export const hasErrorCode = <Code extends string>(
  codes: ReadonlySet<Code>,
  cause: unknown,
): cause is { code: Code } => codes.has((cause as { code?: unknown } | null)?.code as Code);

export const toErrorCode = <Code extends string>(
  codes: ReadonlySet<Code>,
  cause: unknown,
  fallback: Code,
): Code => (hasErrorCode(codes, cause) ? cause.code : fallback);
