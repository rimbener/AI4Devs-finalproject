export type UseSessionGateResult = {
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
