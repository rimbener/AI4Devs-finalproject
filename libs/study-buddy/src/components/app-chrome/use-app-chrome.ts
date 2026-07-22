import { useSession } from '@helsoft/hooks';
import { useMemo, useState } from 'react';

import { getSessionIdentity } from '../../helpers/session-identity.helpers';
import { getMobileTitleKey } from './app-chrome.helpers';

export const useAppChrome = (pathname: string) => {
  const { session } = useSession();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const home = useMemo(
    () => ({
      active: pathname === '/',
      labelKey: 'nav.myLessons' as const,
    }),
    [pathname],
  );
  const newLesson = useMemo(
    () => ({
      active: pathname === '/upload',
      labelKey: 'nav.newLesson' as const,
    }),
    [pathname],
  );

  return {
    home,
    identity: getSessionIdentity(session?.user),
    mobileTitleKey: getMobileTitleKey(pathname),
    newLesson,
    setSignOutOpen,
    signOutOpen,
  };
};
