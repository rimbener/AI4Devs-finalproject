import type { Session } from '@helsoft/supabase-services';
import { AuthService } from '@helsoft/supabase-services';
import { useEffect, useState } from 'react';

import type { UseSessionResult } from './use-session.types';

export const useSession = (): UseSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void AuthService.getSession().then((next) => {
      if (cancelled) return;
      setSession(next);
      setIsLoading(false);
    });

    const unsubscribe = AuthService.onAuthStateChange((next) => {
      if (!cancelled) setSession(next);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { session, isLoading };
};
