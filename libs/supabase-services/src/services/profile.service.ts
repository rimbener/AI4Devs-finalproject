import type { Plan } from '@helsoft/types';

import { ProfileDao } from '../dao/profile.dao';
import type { RawPlansEmbed, RawProfilePlanJoinRow } from '../dao/profile.types';
import type { ProfilePlan } from './profile.types';

const embedPlans = (plans: RawProfilePlanJoinRow['plans']): RawPlansEmbed => {
  if (!plans) throw new Error('Plan not found');
  return Array.isArray(plans) ? plans[0] : plans;
};

const toProfilePlan = (row: RawProfilePlanJoinRow): ProfilePlan => {
  const plan = embedPlans(row.plans);
  return {
    plan: row.plan_id as Plan,
    keySource: plan.use_platform_key ? 'platform' : 'user',
    showKeySettings: plan.show_key_settings,
    showAds: plan.show_ads,
  };
};

/** Maps the single profiles→plans join into the client profile contract. */
export abstract class ProfileService {
  static async getProfile(): Promise<ProfilePlan> {
    return toProfilePlan(await ProfileDao.getCurrentProfile());
  }
}
