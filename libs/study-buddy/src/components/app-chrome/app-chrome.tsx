import { AccountMenu, DesktopBar, InitialsAvatar } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { SignOut } from '../sign-out/sign-out';
import type { AppChromeProps } from './app-chrome.types';
import { useAppChrome } from './use-app-chrome';

/** Desktop-only shell chrome: DesktopBar + AccountMenu (Settings + Sign out). */
export const AppChrome = (_props: AppChromeProps) => {
  const { t } = useLocalization();
  const pathname = usePathname();
  const router = useRouter();
  const { home, pdfFiles, identity, setSignOutOpen, signOutOpen } = useAppChrome(pathname);
  const navigateHome = useCallback(() => router.navigate('/'), [router]);
  const navigatePdfFiles = useCallback(() => router.navigate('/pdf-files'), [router]);
  const homeProps = useMemo(
    () => ({ active: home.active, label: t(home.labelKey), onPress: navigateHome }),
    [home, navigateHome, t],
  );
  const pdfFilesProps = useMemo(
    () => ({
      active: pdfFiles.active,
      label: t(pdfFiles.labelKey),
      onPress: navigatePdfFiles,
    }),
    [navigatePdfFiles, pdfFiles, t],
  );
  const accountMenu = identity ? (
    <AccountMenu
      email={identity.email}
      identityLabel={identity.label}
      initials={identity.initials}
      onSettings={() => router.navigate('/settings')}
      onSignOut={() => setSignOutOpen(true)}
      renderTrigger={({ expanded, onPress }) => (
        <InitialsAvatar
          accessibilityLabel={t('nav.openAccountMenu', { label: identity.label })}
          accessibilityState={{ expanded }}
          initials={identity.initials}
          onPress={onPress}
        />
      )}
      settingsLabel={t('nav.settings')}
      signOutLabel={t('auth.logOut')}
    />
  ) : null;

  return (
    <>
      <DesktopBar
        avatar={accountMenu}
        brandLabel={t('brand.name')}
        home={homeProps}
        pdfFiles={pdfFilesProps}
      />
      <SignOut open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
};
