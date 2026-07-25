import type { ErrorMessageWithRetryProps } from '../../molecules/error-message-with-retry/error-message-with-retry.types';
import type { ScreenContainerProps } from '../screen-container/screen-container.types';

export type ErrorScreenProps = ErrorMessageWithRetryProps &
  Pick<ScreenContainerProps, 'edges' | 'testID'>;
