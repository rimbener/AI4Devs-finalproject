jest.mock('../dao/profile.dao', () => ({
  ProfileDao: { getCurrentProfile: jest.fn() },
}));

import { ProfileDao } from '../dao/profile.dao';
import { ProfileService } from './profile.service';

const dao = ProfileDao as jest.Mocked<typeof ProfileDao>;

describe('ProfileService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('@s2 maps free plan flags to user-key entitlements', async () => {
    dao.getCurrentProfile.mockResolvedValue({
      plan_id: 'free',
      plans: {
        use_platform_key: false,
        show_ads: true,
        show_key_settings: true,
      },
    });

    await expect(ProfileService.getProfile()).resolves.toEqual({
      plan: 'free',
      keySource: 'user',
      showKeySettings: true,
      showAds: true,
    });
  });

  it('@s9 maps paid plan flags to platform entitlements without key settings or ads', async () => {
    dao.getCurrentProfile.mockResolvedValue({
      plan_id: 'paid',
      plans: {
        use_platform_key: true,
        show_ads: false,
        show_key_settings: false,
      },
    });

    await expect(ProfileService.getProfile()).resolves.toEqual({
      plan: 'paid',
      keySource: 'platform',
      showKeySettings: false,
      showAds: false,
    });
  });

  it('@s16 exposes showAds from the plan row without starting ad behavior', async () => {
    dao.getCurrentProfile.mockResolvedValue({
      plan_id: 'free',
      plans: {
        use_platform_key: false,
        show_ads: true,
        show_key_settings: true,
      },
    });

    await expect(ProfileService.getProfile()).resolves.toMatchObject({
      plan: 'free',
      showAds: true,
    });
  });

  it('unwraps a plans embed returned as a one-element array', async () => {
    dao.getCurrentProfile.mockResolvedValue({
      plan_id: 'free',
      plans: [
        {
          use_platform_key: false,
          show_ads: true,
          show_key_settings: true,
        },
      ],
    });

    await expect(ProfileService.getProfile()).resolves.toEqual({
      plan: 'free',
      keySource: 'user',
      showKeySettings: true,
      showAds: true,
    });
  });

  it('rejects when the plans embed is missing', async () => {
    dao.getCurrentProfile.mockResolvedValue({ plan_id: 'free', plans: null });

    await expect(ProfileService.getProfile()).rejects.toThrow('Plan not found');
  });

  it('rejects when the plans embed is an empty array', async () => {
    dao.getCurrentProfile.mockResolvedValue({ plan_id: 'free', plans: [] });

    await expect(ProfileService.getProfile()).rejects.toThrow('Plan not found');
  });
});
