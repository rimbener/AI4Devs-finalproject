const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule;

// Runs before the entry module in EVERY bundle Metro serves for this project — including
// the server-side route-manifest bundle Expo Router builds to introspect layout files — so
// StyleSheet.configure() always executes before any StyleSheet.create() call, with no
// per-file import required.
config.serializer.getModulesRunBeforeMainModule = (entryFilePath) => [
  ...defaultGetModulesRunBeforeMainModule(entryFilePath),
  require.resolve('@helsoft/components/theme'),
];

module.exports = config;
