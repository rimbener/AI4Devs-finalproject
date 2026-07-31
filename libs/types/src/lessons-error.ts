/**
 * Normalized outcome codes for `LessonsService` failures. The service maps every DAO/network
 * failure onto one of these so the UI never branches on raw Supabase shapes — message copy is
 * deliberately not part of this contract (UI maps `code` → i18n).
 */
export type LessonsErrorCode = 'network_error' | 'validation_error';

/** Minimal shape a normalized lessons failure carries upward from the service layer. */
export type LessonsError = {
  code: LessonsErrorCode;
};
