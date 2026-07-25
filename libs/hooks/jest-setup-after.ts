import { notifyManager } from '@tanstack/react-query';
import { act, configure } from '@testing-library/react-native';

configure({ asyncUtilTimeout: 2000 });
jest.setTimeout(8000);

// TanStack Query notifies subscribers outside of React's own batching (via `setTimeout`),
// so the resulting re-render isn't wrapped in `act()` by default — wrapping the notify
// callback closes that gap, as documented at
// https://tanstack.com/query/latest/docs/reference/notifyManager#notifymanagersetnotifyfunction.
notifyManager.setNotifyFunction(act);
