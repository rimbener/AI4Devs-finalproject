/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['react-native-unistyles/mocks', require.resolve('@helsoft/components/theme')],
  setupFilesAfterEnv: ['<rootDir>/jest-setup-after.ts'],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
};
