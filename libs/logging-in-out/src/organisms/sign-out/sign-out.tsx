import { Button, Dialog } from '@helsoft/components';
import { useLocalization } from '@helsoft/localization';
import type { SignOutErrorDialogProps, SignOutProps } from './sign-out.types';
import { useSignOut } from './use-sign-out';

/**
 * SignOut — prop-driven confirm dialog around logout. No useAuth: parent injects onSignOut.
 * No navigation on confirm: session-guard reacts to the session change.
 * Failures surface via `error` → retry (reset + sign out again) or cancel (reset only).
 */
export const SignOut = ({
  onSignOut,
  isSigningOut,
  error,
  onSignOutError,
  open,
  onOpenChange,
  style,
}: SignOutProps) => {
  const { t, confirmOpen, setConfirmOpen } = useSignOut({ open, onOpenChange });

  const onConfirm = () => {
    setConfirmOpen(false);
    onSignOut();
  };

  const onRetry = () => {
    onSignOutError?.();
    onSignOut();
  };

  return (
    <>
      {open === undefined ? (
        <Button
          variant="outlined"
          onPress={() => setConfirmOpen(true)}
          disabled={isSigningOut}
          style={style}
        >
          {t('auth.logOut')}
        </Button>
      ) : null}
      {error ? <SignOutErrorDialog onConfirm={onRetry} onClose={onSignOutError} /> : null}
      {confirmOpen && !error ? (
        <SignOutDialog
          onConfirm={onConfirm}
          isSigningOut={isSigningOut}
          setConfirmOpen={setConfirmOpen}
        />
      ) : null}
    </>
  );
};

const SignOutErrorDialog = ({ onConfirm, onClose }: SignOutErrorDialogProps) => {
  const { t } = useLocalization();
  return (
    <Dialog
      open
      onConfirm={onConfirm}
      onClose={onClose}
      headline={t('auth.logOutError')}
      confirmLabel={t('auth.logOutRetry')}
      cancelLabel={t('auth.logOutCancelAction')}
    />
  );
};

type SignOutDialogProps = {
  onConfirm: () => void;
  isSigningOut: boolean;
  setConfirmOpen: (open: boolean) => void;
};

const SignOutDialog = ({ onConfirm, isSigningOut, setConfirmOpen }: SignOutDialogProps) => {
  const { t } = useLocalization();
  return (
    <Dialog
      open={true}
      onClose={() => setConfirmOpen(false)}
      headline={t('auth.logOutConfirmHeadline')}
      confirmLabel={t('auth.logOutConfirmAction')}
      cancelLabel={t('auth.logOutCancelAction')}
      onConfirm={onConfirm}
    >
      {isSigningOut ? t('auth.signingOut') : t('auth.logOutConfirmBody')}
    </Dialog>
  );
};
