const { test, expect } = require('@playwright/test');

// Title 'Features/MatchingActivity' → slug 'features-matchingactivity'.
const story = (name) => `/?path=/story/features-matchingactivity--${name}`;

test('pairing all items and submitting shows Correct and explanation', async ({ page }) => {
  await page.goto(story('default'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('France', { exact: true }).click();
  await canvas.getByText('Paris', { exact: true }).click();
  await canvas.getByText('Germany', { exact: true }).click();
  await canvas.getByText('Berlin', { exact: true }).click();
  await canvas.getByText('Italy', { exact: true }).click();
  await canvas.getByText('Rome', { exact: true }).click();
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toBeVisible();
});

test('WithoutExplanation story grades without Explanation', async ({ page }) => {
  await page.goto(story('without-explanation'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('France', { exact: true }).click();
  await canvas.getByText('Paris', { exact: true }).click();
  await canvas.getByText('Germany', { exact: true }).click();
  await canvas.getByText('Berlin', { exact: true }).click();
  await canvas.getByText('Italy', { exact: true }).click();
  await canvas.getByText('Rome', { exact: true }).click();
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toHaveCount(0);
});
