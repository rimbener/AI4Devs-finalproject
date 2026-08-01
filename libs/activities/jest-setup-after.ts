import React from 'react';

// Activity organisms import @helsoft/components' Card, which imports @helsoft/hooks
// (useInteractionState), which pulls in @helsoft/services (locale) or native modules -> AsyncStorage module.
// Replace it with an in-memory stub so component tests never touch native storage. Mirrors
// libs/components/jest-setup-after.ts (same root cause, one workspace layer over).
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Unit tests render `Animated.View` as a plain `View` so entrance/slide animations
// can't schedule frame updates that fire outside act() and warn. Component logic is
// tested via the underlying views; the animation itself is a presentational concern.
// The RN index exposes `Animated.View` as a getter, so it must be redefined with a
// descriptor rather than assigned (assignment to a getter-only property no-ops).
const RN = require('react-native');
const PlainView = (props) => React.createElement(RN.View, props);
Object.defineProperty(RN.Animated, 'View', {
  configurable: true,
  get: () => PlainView,
});

// The jest-expo preset installs expo's lazy `global.fetch` getter. A late teardown
// read of it requires `expo-modules-core`, which warns about the missing
// 'ExpoModulesCoreJSLogger' native module after the test's console has closed
// ("Cannot log after tests are done"). Replace the getter with a plain value so
// that require can never fire late.
const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
if (fetchDescriptor && typeof fetchDescriptor.get === 'function') {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: globalThis.originalFetch ?? undefined,
  });
}
