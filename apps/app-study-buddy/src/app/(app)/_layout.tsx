import { useLocalization } from '@helsoft/localization';
import { LESSON_STACK_SCREENS } from '@helsoft/study-buddy';
import { Stack } from 'expo-router';

// Keep (tabs) as the stack base so lesson deep-links can return to the tab shell (@s4).
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  const { t } = useLocalization();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('nav.myLessons') }} />
      {LESSON_STACK_SCREENS.map(({ name, titleKey }) => (
        <Stack.Screen key={name} name={name} options={{ title: t(titleKey) }} />
      ))}
    </Stack>
  );
}
