import { cleanup } from '@testing-library/react-native';

// The components barrel transitively imports @helsoft/supabase-services, which pulls in the
// native AsyncStorage module. Replace it with an in-memory stub so component tests
// (which mock @helsoft/localization anyway) never touch native storage.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// LessonGeneration reads stored prefs on mount; unresolved AsyncStorage reads can stall RTL v14 render.
jest.mock('@helsoft/services', () => {
  const actual = jest.requireActual<typeof import('@helsoft/services')>('@helsoft/services');
  return {
    ...actual,
    GenerationPreferenceService: {
      getStoredPreference: jest.fn().mockResolvedValue(null),
      setStoredPreference: jest.fn().mockResolvedValue(undefined),
    },
  };
});

afterEach(async () => {
  await cleanup();
});
