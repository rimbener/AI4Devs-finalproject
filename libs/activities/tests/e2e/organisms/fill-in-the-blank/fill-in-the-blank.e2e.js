const { test, expect } = require('@playwright/test');

// Title 'Templates/FillInTheBlank' → slug 'templates-fillintheblank'.
const story = (name) => `/?path=/story/templates-fillintheblank--${name}`;

// Interactive drives type → submit → feedback (@s2,@s3,@s5,@s6,@s7).
test('submitting a matching answer shows correct feedback and locks (@s2)', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const input = canvas.getByLabel('Fill in the blank');
  await input.fill('paris');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true })).toBeVisible();
});

test('submitting a wrong answer shows incorrect feedback and reveals accepted (@s3)', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const input = canvas.getByLabel('Fill in the blank');
  await input.fill('london');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  await expect(canvas.getByText('cancel', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Paris', { exact: true })).toBeVisible();
});

test('empty submit grades incorrect and still resolves (@s6)', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Paris', { exact: true })).toBeVisible();
});

test('Enter/return submits the same grade path (@s7)', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const input = canvas.getByLabel('Fill in the blank');
  await input.fill('paris');
  await input.press('Enter');

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
});

test('after submit the attempt cannot be changed or resubmitted (@s5)', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const input = canvas.getByLabel('Fill in the blank');
  await input.fill('paris');
  await canvas.getByText('Submit', { exact: true }).click();
  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();

  // RN web maps editable={false} to readonly — input stays locked at submitted value.
  await expect(input).toHaveAttribute('readonly', '');
  await expect(input).toHaveValue('paris');

  // Submit control is replaced by the result once locked — no resubmit path remains.
  await expect(canvas.getByText('Submit', { exact: true })).toHaveCount(0);
  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Incorrect', { exact: true })).toHaveCount(0);
  await expect(input).toHaveValue('paris');
});
