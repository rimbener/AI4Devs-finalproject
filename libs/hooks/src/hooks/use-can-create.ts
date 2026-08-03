import { useGetApiKey } from './use-get-api-key';
import { useProfile } from './use-profile';

/**
 * Single source for a learner's creation entitlement: a platform-key plan or a saved user key
 * (`canCreate = keySource === 'platform' || hasKey`). Composes `useProfile` + `useGetApiKey` so
 * upload/create gates don't re-derive the rule themselves; the derivation lives here (D4).
 */
export const useCanCreate = () => {
  const { profile } = useProfile();
  const { hasKey } = useGetApiKey();

  const canCreate = Boolean(profile?.keySource === 'platform' || hasKey);

  return {
    canCreate,
  };
};
