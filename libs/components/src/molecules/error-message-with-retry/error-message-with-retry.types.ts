export type ErrorMessageWithRetryProps = {
  /**
   * Localization key for the error message.
   * When omitted, falls back to the English default in the component.
   */
  messageKey?: string;
  /**
   * Localization key for the retry button label.
   * When omitted, falls back to the English default in the component.
   */
  retryKey?: string;
  onRetry?: () => void;
};
