const { test, expect } = require('@playwright/test');

// Title 'Organisms/ApiKeyFormDialog' → slug 'organisms-apikeyformdialog'.
const story = (name) => `/?path=/story/organisms-apikeyformdialog--${name}`;

test('Add story loads', async ({ page }) => {
  await page.goto(story('add'));
  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();
  expect(page.url()).toContain('organisms-apikeyformdialog--add');
});

test('Add story shows provider radios and disabled Save', async ({ page }) => {
  await page.goto(story('add'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('radio', { name: 'Groq' })).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('AddWithProvider story shows guidance link', async ({ page }) => {
  await page.goto(story('add-with-provider'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByRole('button', { name: /Don't have a key\?/ })).toBeVisible();
});

test('Replace story shows fixed provider without radios', async ({ page }) => {
  await page.goto(story('replace'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=OpenAI').first()).toBeVisible();
  await expect(canvas.getByRole('radiogroup')).toHaveCount(0);
});

test('Submitting story shows saving label', async ({ page }) => {
  await page.goto(story('submitting'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Saving')).toBeVisible();
});
