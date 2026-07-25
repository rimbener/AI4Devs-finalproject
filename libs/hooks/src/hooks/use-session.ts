import type { Session } from '@helsoft/supabase-services';
import { AuthService } from '@helsoft/supabase-services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import type { UseSessionResult } from './use-session.types';

/** Query key for the current Supabase auth session — shared with any hook that needs to
 * read it via the QueryClient cache (e.g. to invalidate on sign-out). */
export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export const useSession = (): UseSessionResult => {
  const queryClient = useQueryClient();
  const receivedAuthEventRef = useRef(false);
  // Seeded from whatever session is already cached at mount (if any), then kept in sync by the
  // bridge below — read in a ref (not state) so the comparison itself never triggers a render.
  const previousUserIdRef = useRef<string | undefined>(
    queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY)?.user?.id,
  );

  const { data, isLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    // Guards against the initial getSession() resolving after onAuthStateChange has already
    // delivered a newer session (e.g. sign-in completes while this fetch is still in flight):
    // once that happens, this stale resolution must not clobber the cache with an older value.
    queryFn: async () => {
      const session = await AuthService.getSession();
      if (receivedAuthEventRef.current) {
        return queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY) ?? null;
      }
      return session;
    },
    staleTime: Infinity,
  });

  // Every session change after mount (sign-in, sign-out, token refresh) arrives through this
  // Supabase callback, so it is pushed straight into the query cache rather than re-fetched.
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((next) => {
      receivedAuthEventRef.current = true;
      const nextUserId = next?.user?.id;
      if (nextUserId !== previousUserIdRef.current) {
        queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      }
      previousUserIdRef.current = nextUserId;
      queryClient.setQueryData(SESSION_QUERY_KEY, next);
    });
    return () => unsubscribe?.();
  }, [queryClient]);

  return { session: data ?? null, isLoading };
};
