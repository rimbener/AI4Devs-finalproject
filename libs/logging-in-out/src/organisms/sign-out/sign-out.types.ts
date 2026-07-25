import type { AuthErrorCode } from '@helsoft/types';
import type { StyleProp, ViewStyle } from 'react-native';

export type SignOutProps = {
  isSigningOut: boolean;
  error: AuthErrorCode | null;
  /** Called on confirm / retry; parent owns auth (e.g. useSignOut().signOut). */
  onSignOut: () => void;
  /** When defined, the confirm dialog is controlled and the default trigger is hidden. */
  open?: boolean;
  /** Receives confirm-dialog visibility changes in controlled mode. */
  onOpenChange?: (next: boolean) => void;
  /**
   * Clears the parent error (e.g. mutation reset). Error-dialog cancel calls this only;
   * retry calls it then onSignOut again.
   */
  onSignOutError?: () => void;
  style?: StyleProp<ViewStyle>;
};

export type SignOutErrorDialogProps = {
  onConfirm: () => void;
  onClose?: () => void;
};
