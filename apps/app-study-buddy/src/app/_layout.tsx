import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans';
import { MaterialSymbolsRounded_400Regular } from '@expo-google-fonts/material-symbols-rounded';
import { Sora_700Bold } from '@expo-google-fonts/sora';
import '@helsoft/components/theme';
import { LocalizationProvider, useLocalization } from '@helsoft/localization';
import { useFonts } from 'expo-font';
import { getLocales } from 'expo-localization';
import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/supabase';
import { ErrorScreen } from '@helsoft/components';
import { QueryProvider, useGetApiKey, useProfile, useSession } from '@helsoft/hooks';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // The app is the only place that reads the native device locale; the shared,
  // platform-agnostic lib resolves it to a supported locale.
  const deviceLocale = getLocales()[0]?.languageTag;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LocalizationProvider deviceLocale={deviceLocale}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <QueryProvider>
            <RootValidation />
          </QueryProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}

function RootValidation() {
  const { t } = useLocalization();
  // Single readiness gate: the app waits for the session, the profile, and the key status before
  // rendering any route. `useSession` is branched on first — a signed-out visitor is "ready" as
  // soon as the session resolves, because the profile/key-status queries stay disabled (their
  // `isPending` would otherwise never settle, the TanStack v5 disabled-query gotcha).
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, isLoading: isProfileLoading, error, retry } = useProfile();
  const { isLoading: isApiKeyLoading } = useGetApiKey();

  // Keys must match `fontFamily` tokens in `@helsoft/components` theme typography.
  const [fontsLoaded, fontError] = useFonts({
    'Material Symbols Rounded': MaterialSymbolsRounded_400Regular,
    Sora: Sora_700Bold,
    'IBM Plex Sans': IBMPlexSans_400Regular,
    'IBM Plex Mono': IBMPlexMono_400Regular,
  });

  const isSignedIn = Boolean(session?.user?.id);
  const isLoading = isSessionLoading || (isSignedIn && (isProfileLoading || isApiKeyLoading));

  useEffect(() => {
    if (isLoading) {
      AccessibilityInfo.announceForAccessibility(t('entitlements.loading'));
    } else if (!fontsLoaded && !fontError) {
      AccessibilityInfo.announceForAccessibility(t('fonts.loading'));
    } else {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, fontsLoaded, fontError, t]);

  if (isLoading) return null;

  if (error) {
    return (
      <ErrorScreen
        messageKey="entitlements.error.message"
        retryKey="entitlements.error.retry"
        onRetry={retry}
      />
    );
  }

  if (fontError) {
    return <ErrorScreen messageKey="fonts.error.message" />;
  }

  if (!fontsLoaded) return null;

  return <RootNavigator guard={!!profile} />;
}

function RootNavigator({ guard }: { guard: boolean }) {
  return (
    <Stack>
      <Stack.Protected guard={guard}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!guard}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
