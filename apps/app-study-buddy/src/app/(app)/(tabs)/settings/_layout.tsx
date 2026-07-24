import { Stack } from 'expo-router';

/** Nested settings stack — entry tab + API keys screen (header owned by screens). */
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
