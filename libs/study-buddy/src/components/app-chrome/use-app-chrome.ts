import { useSession } from '@helsoft/hooks';
import { useMemo, useState } from 'react';

import { getSessionIdentity } from '../../helpers/session-identity.helpers';

export const useAppChrome = (pathname: string) => {
  const { session } = useSession();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { home, pdfFiles } = useMemo(
    () => ({
      home: {
        active: pathname === '/',
        labelKey: 'nav.myLessons' as const,
      },
      pdfFiles: {
        active: pathname === '/pdf-files',
        labelKey: 'nav.myPdfFiles' as const,
      },
    }),
    [pathname],
  );

  return {
    home,
    pdfFiles,
    identity: getSessionIdentity(session?.user),
    setSignOutOpen,
    signOutOpen,
  };
};
