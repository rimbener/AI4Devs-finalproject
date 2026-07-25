import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import type { QueryProviderProps } from './query-provider.types';

/**
 * Root TanStack Query provider — every `@helsoft/hooks` hook that reads/writes Supabase
 * (useSession, useAuth, useProfile, ...) needs this as an ancestor. One `QueryClient` per
 * mount (React.useState lazy-init keeps it stable across re-renders).
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
