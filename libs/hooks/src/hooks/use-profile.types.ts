import type { Profile } from '@helsoft/types';

export type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
};
