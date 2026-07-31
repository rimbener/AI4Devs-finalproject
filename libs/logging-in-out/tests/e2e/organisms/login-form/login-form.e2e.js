const { test, expect } = require('@playwright/test');

test('filling both fields enables submit', async ({ page }) => {
  await page.goto('/?path=/story/organisms-loginform--empty');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Log in', { exact: true })).toBeDisabled();

  await canvas.getByLabel('Email').fill('user@example.com');
  await canvas.getByLabel('Password').fill('secret1');

  await expect(canvas.getByText('Log in', { exact: true })).toBeEnabled();
});

test('auth-error banner leaves the form editable so valid input enables submit', async ({
  page,
}) => {
  await page.goto('/?path=/story/organisms-loginform--error');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Email').fill('user@example.com');
  await canvas.getByLabel('Password').fill('secret1');

  await expect(canvas.getByText('Log in', { exact: true })).toBeEnabled();
});

test('inline field errors keep submit disabled after typing', async ({ page }) => {
  await page.goto('/?path=/story/organisms-loginform--error-inline-validation');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Email').fill('user@example.com');
  await canvas.getByLabel('Password').fill('secret1');

  await expect(canvas.getByText('Log in', { exact: true })).toBeDisabled();
});
