import { useSession } from './use-session';

type UseSessionGateResult = {
  /** The signed-in user's id, or undefined while unauthenticated. */
  sessionUserId: string | undefined;
  /** True while the session itself is still resolving. */
  isSessionLoading: boolean;
  /** `useQuery({ enabled })` for a query keyed on `sessionUserId`. */
  enabled: boolean;
  /**
   * Combines session-loading with a query's own `isPending`, the same way every user-scoped
   * hook needs to: the session settling and the query itself being enabled both gate "loading".
   */
  deriveIsLoading: (isQueryPending: boolean) => boolean;
};

/**
 * Shared session-derived gating for user-scoped hooks (`useApiKey`, `useProfile`): a query keyed
 * on the session user id should be `enabled`/loading in lockstep with the session itself. Hoisted
 * once two hooks repeated the same `Boolean(sessionUserId) && !isSessionLoading` /
 * `isSessionLoading || (Boolean(sessionUserId) && isPending)` derivations verbatim (round 1
 * full-review code-quality finding). Not barrel-exported — internal to `libs/hooks/src/hooks`,
 * same convention as `use-auth.helpers.ts`.
 */
export const useSessionGate = (): UseSessionGateResult => {
  const { session, isLoading: isSessionLoading } = useSession();
  const sessionUserId = session?.user?.id;
  const enabled = Boolean(sessionUserId) && !isSessionLoading;

  const deriveIsLoading = (isQueryPending: boolean): boolean =>
    isSessionLoading || (Boolean(sessionUserId) && isQueryPending);

  return { sessionUserId, isSessionLoading, enabled, deriveIsLoading };
};
