import type { ProfilePlan } from '@helsoft/supabase-services';

export type UseProfileResult = {
  profile: ProfilePlan | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
};
