import { initSupabase } from '@helsoft/supabase-services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// The Android emulator's loopback interface is itself, not the host machine;
// 10.0.2.2 is the emulator's alias for the host's localhost.
const supabaseUrl =
  Platform.OS === 'android' && rawSupabaseUrl
    ? rawSupabaseUrl.replace(/(127\.0\.0\.1|localhost)/, '10.0.2.2')
    : rawSupabaseUrl;

if (supabaseUrl && supabaseAnonKey) {
  initSupabase({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    // On web, supabase-js falls back to localStorage; AsyncStorage is for native.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    detectSessionInUrl: Platform.OS === 'web',
  });
} else if (__DEV__) {
  console.warn(
    'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example).',
  );
}
