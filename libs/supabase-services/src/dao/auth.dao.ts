import type { Session } from '@supabase/supabase-js';

import { getSupabase } from '../supabase/supabase-client';

import type {
  AuthStateChangeUnsubscribe,
  SignInWithPasswordParams,
  SignInWithPasswordResult,
} from './auth.types';

/**
 * Raw Supabase auth data access. No validation, no error mapping — the service layer
 * decides what an invalid-credentials or network failure means to the UI.
 */
export abstract class AuthDao {
  static async signInWithPassword({
    email,
    password,
  }: SignInWithPasswordParams): Promise<SignInWithPasswordResult> {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  static async signOut(): Promise<void> {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  }

  static async getSession(): Promise<Session | null> {
    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  static onAuthStateChange(
    callback: (session: Session | null) => void,
  ): AuthStateChangeUnsubscribe {
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => data.subscription.unsubscribe();
  }
}
