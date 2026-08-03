// Mock TurboModuleRegistry before react-native is loaded to prevent
// DevMenu and other native module errors in Jest (React Native 0.86+).
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: () => ({
    getConstants: () => ({}),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  }),
  get: () => null,
}));

// Mock NativeEventEmitter to prevent "requires a non-null argument" errors.
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class NativeEventEmitter {
    addListener = jest.fn(() => ({ remove: jest.fn() }));
    removeAllListeners = jest.fn();
    removeSubscription = jest.fn();
    listeners = jest.fn();
  };
});

// Mock useWindowDimensions to prevent native module errors in test environment.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 800, height: 600, scale: 1, fontScale: 1 }),
}));

// Mock Dimensions to prevent NativeDeviceInfo.getConstants errors.
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  __esModule: true,
  default: {
    get: () => ({ width: 800, height: 600 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  useWindowDimensions: () => ({ width: 800, height: 600, scale: 1, fontScale: 1 }),
}));

// Mock expo-router/ui to prevent EXDevLauncher and other expo native module errors.
jest.mock('expo-router/ui', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: mock props
  Tabs: (props: any) => props.children,
  // biome-ignore lint/suspicious/noExplicitAny: mock props
  TabSlot: (props: any) => props.children,
  // biome-ignore lint/suspicious/noExplicitAny: mock props
  TabTrigger: (props: any) => props.children,
  // biome-ignore lint/suspicious/noExplicitAny: mock props
  TabList: (props: any) => props.children,
}));

// Mock react-native-safe-area-context to prevent native module errors.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    SafeAreaProvider: (props: any) => props.children,
    // biome-ignore lint/suspicious/noExplicitAny: mock props
    SafeAreaView: (props: any) => React.createElement('SafeAreaView', props),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    },
  };
});
