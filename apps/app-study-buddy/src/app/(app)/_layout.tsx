import { ApiKeyProvider, ProfileProvider } from '@helsoft/hooks';
import { useLocalization } from '@helsoft/localization';
import { LESSON_STACK_SCREENS } from '@helsoft/study-buddy';
import { Stack } from 'expo-router';

// Keep (tabs) as the stack base so lesson deep-links can return to the tab shell (@s4).
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
        {/* Bare Stack → default header (back button + title) on pushed lesson routes (@s1-@s6);
            (tabs) opts out so the root tabs stay headerless (@s7). */}
        <Stack>
          {/* title (unseen here, headerShown: false) becomes the pushed screens' back-button
              label — without it, the back button falls back to the literal route name "(tabs)". */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('nav.myLessons') }} />
          {LESSON_STACK_SCREENS.map(({ name, titleKey }) => (
            <Stack.Screen key={name} name={name} options={{ title: t(titleKey) }} />
          ))}
        </Stack>
      </ProfileProvider>
    </ApiKeyProvider>
  );
}
