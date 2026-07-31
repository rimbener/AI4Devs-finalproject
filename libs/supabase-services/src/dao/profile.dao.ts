import { getSupabase } from '../supabase/supabase-client';

import type { RawProfilePlanJoinRow } from './profile.types';

/** One Supabase round-trip: caller's profile row joined with its plan flags. */
export abstract class ProfileDao {
  static async getCurrentProfile(): Promise<RawProfilePlanJoinRow> {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('plan_id, plans(use_platform_key, show_ads, show_key_settings)')
      .single();
    if (error) throw error;
    if (!data) throw new Error('Profile not found');
    return data as RawProfilePlanJoinRow;
  }
}
