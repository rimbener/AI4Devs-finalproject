import { useSession } from './use-session';

type UseSessionGateResult = {
  /** The signed-in user's id, or undefined while unauthenticated. */
  sessionUserId: string | undefined;
  /** True while the session itself is still resolving. */
  isSessionLoading: boolean;
  /** `useQuery({ enabled })` for a query keyed on `sessionUserId`. */
  enabled: boolean;
};

/**
 * Shared session-derived gating for user-scoped hooks (`useGetApiKey`, `useProfile`): a query
 * keyed on the session user id should be `enabled` in lockstep with the session itself. Hoisted
 * once two hooks repeated the same `Boolean(sessionUserId) && !isSessionLoading` derivation
 * verbatim (round 1 full-review code-quality finding). Not barrel-exported — internal to
 * `libs/hooks/src/hooks`, same convention as `use-auth.helpers.ts`. Loading is NOT derived here:
 * the app bootstrap owns overall readiness (it waits on `useSession`, `useProfile` and
 * `useGetApiKey`, branching on the session before trusting any gated query's pending state).
 */
export const useSessionGate = (): UseSessionGateResult => {
  const { session, isLoading: isSessionLoading } = useSession();
  const sessionUserId = session?.user?.id;
  const enabled = Boolean(sessionUserId) && !isSessionLoading;

  return { sessionUserId, isSessionLoading, enabled };
};
