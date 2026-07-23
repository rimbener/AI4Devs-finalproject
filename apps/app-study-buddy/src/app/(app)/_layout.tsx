import { ApiKeyProvider, ProfileProvider } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { Stack } from 'expo-router';

// Keep (tabs) as the stack base so lesson deep-links can return to the tab shell (@s16).
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  const { t } = useLocalization();

  // ApiKeyProvider + ProfileProvider: one shared key-status and one profile→plans
  // flags fetch for the authenticated shell (Settings, PDF files, …).
  return (
    <ApiKeyProvider>
      <ProfileProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]/index" options={{ title: t('nav.lesson') }} />
          <Stack.Screen name="lesson/[id]/player" options={{ title: t('nav.study') }} />
          <Stack.Screen name="lesson/[id]/results" options={{ title: t('nav.results') }} />
        </Stack>
      </ProfileProvider>
    </ApiKeyProvider>
  );
}
