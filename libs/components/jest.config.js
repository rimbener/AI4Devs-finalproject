/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['react-native-unistyles/mocks', '<rootDir>/src/theme/unistyles.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup-after.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
  // Parallel turbo/bootstrap can starve workers; avoid flaky 5s render timeouts.
  testTimeout: 15000,
};
