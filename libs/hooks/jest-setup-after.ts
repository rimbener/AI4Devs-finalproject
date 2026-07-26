import { notifyManager } from '@tanstack/react-query';
import { act, configure } from '@testing-library/react-native';

configure({ asyncUtilTimeout: 2000 });
jest.setTimeout(8000);

// Expo defines `global.fetch` as a lazily-resolved getter (expo/src/winter/installGlobal.ts).
// If nothing touches it during a test, some background RN/Expo teardown path ends up being the
// first to read it — after Jest has already torn down that file's console interception — which
// turns the underlying (harmless, native-module-unavailable-in-Jest) warning into a
// "Cannot log after tests are done" failure. Resolving it here, up front, keeps that one-time
// warning (if any) inside a still-live console context instead.
void global.fetch;

// TanStack Query notifies subscribers outside of React's own batching (via `setTimeout`),
// so the resulting re-render isn't wrapped in `act()` by default — wrapping the notify
// callback closes that gap, as documented at
// https://tanstack.com/query/latest/docs/reference/notifyManager#notifymanagersetnotifyfunction.
notifyManager.setNotifyFunction(act);
