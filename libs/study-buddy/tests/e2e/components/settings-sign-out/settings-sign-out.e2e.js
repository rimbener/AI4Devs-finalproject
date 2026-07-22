const { test, expect } = require('@playwright/test');

// Title 'Features/SettingsSignOut' → slug 'features-settingssignout'.
const story = (name) => `/?path=/story/features-settingssignout--${name}`;

test('Mobile story shows Sign out trigger', async ({ page }) => {
  await page.goto(story('mobile'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('Desktop story does not show Sign out trigger', async ({ page }) => {
  await page.goto(story('desktop'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Desktop Settings (no Sign out here)')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Log out' })).toHaveCount(0);
});
