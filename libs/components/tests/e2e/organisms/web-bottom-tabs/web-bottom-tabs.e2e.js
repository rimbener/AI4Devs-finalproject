const { test, expect } = require('@playwright/test');

const story = (name) => `/?path=/story/organisms-webbottomtabs--${name}`;

test('Content story renders Material bottom tabs', async ({ page }) => {
  await page.goto(story('content'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByTestId('web-bottom-tabs')).toBeVisible({ timeout: 15000 });
  await expect(canvas.getByTestId('web-tab-menu_book')).toBeVisible();
  await expect(canvas.getByTestId('web-tab-picture_as_pdf')).toBeVisible();
  await expect(canvas.getByTestId('web-tab-settings')).toBeVisible();
  await expect(
    canvas.getByTestId('web-tab-menu_book').getByText('My lessons', { exact: true }),
  ).toBeVisible();
  await expect(
    canvas.getByTestId('web-tab-settings').getByText('Settings', { exact: true }),
  ).toBeVisible();
});

test('SingleTab story renders only the injected trigger', async ({ page }) => {
  await page.goto(story('single-tab'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByTestId('web-bottom-tabs')).toBeVisible({ timeout: 15000 });
  await expect(canvas.getByTestId('web-tab-menu_book')).toBeVisible();
  await expect(canvas.getByTestId('web-tab-settings')).toHaveCount(0);
});
