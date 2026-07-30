const { test, expect } = require('@playwright/test');

test('selecting a language switches the active locale live', async ({ page }) => {
  await page.goto('/?path=/story/organisms-languagesettings--default');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Español', { exact: true }).click();

  // Real useLocalization()/LocalizationProvider (.storybook/preview.tsx) — switching to
  // Spanish re-renders the section heading translated ("Idioma"), not just a visual toggle.
  await expect(canvas.getByText('Idioma', { exact: true })).toBeVisible();
});
