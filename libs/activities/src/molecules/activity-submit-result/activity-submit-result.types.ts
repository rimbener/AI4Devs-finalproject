import type { ReactNode } from 'react';

export type ActivitySubmitResultProps = {
  /** Submit button label. */
  submitLabel: string;
  /** True once the activity is complete enough to submit (toggles submit button visibility). */
  canSubmit: boolean;
  /** Fired when the submit button is pressed. */
  onSubmit: () => void;
  /**
   * True once a result exists. While true the submit button is replaced by the
   * result content (and scrolled into view once). Callers pass this explicitly —
   * it is never derived from `children`.
   */
  hasResult: boolean;
  /**
   * Result content. Rendered in place of the submit button while `hasResult` is
   * true. Omit (or pass a falsy value) while there is no result.
   */
  children?: ReactNode;
  /** testID forwarded to the submit button. */
  submitTestID?: string;
  /** testID on the result container. */
  resultTestID?: string;
};
