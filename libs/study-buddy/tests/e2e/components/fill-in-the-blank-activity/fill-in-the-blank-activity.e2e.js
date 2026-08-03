const { test, expect } = require('@playwright/test');

// Title 'Features/FillInTheBlankActivity' → slug 'features-fillintheblankactivity'.
const story = (name) => `/?path=/story/features-fillintheblankactivity--${name}`;

test('submitting a matching answer shows Correct and explanation', async ({ page }) => {
  await page.goto(story('default'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Fill in the blank').fill('Paris');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Paris is the capital of France.', { exact: true })).toBeVisible();
});

test('WithoutExplanation story grades without Explanation', async ({ page }) => {
  await page.goto(story('without-explanation'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Fill in the blank').fill('Berlin');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Paris', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toHaveCount(0);
});
