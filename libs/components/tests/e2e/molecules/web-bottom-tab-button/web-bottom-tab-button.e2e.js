const { test, expect } = require('@playwright/test');

const story = (name) => `/?path=/story/molecules-webbottomtabbutton--${name}`;

test('Focused story shows selected My lessons tab', async ({ page }) => {
  await page.goto(story('focused'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByTestId('web-tab-menu_book')).toBeVisible({ timeout: 15000 });
  await expect(
    canvas.getByTestId('web-tab-menu_book').getByText('My lessons', { exact: true }),
  ).toBeVisible();
});

test('SettingsFocused story shows selected Settings tab', async ({ page }) => {
  await page.goto(story('settings-focused'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByTestId('web-tab-settings')).toBeVisible({ timeout: 15000 });
  await expect(
    canvas.getByTestId('web-tab-settings').getByText('Settings', { exact: true }),
  ).toBeVisible();
});
