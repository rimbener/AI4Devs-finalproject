const { test, expect } = require('@playwright/test');

// Title 'Features/OpenEndedActivity' → slug 'features-openendedactivity'.
const story = (name) => `/?path=/story/features-openendedactivity--${name}`;

const MODEL_ANSWER = 'Conversion of light energy into chemical energy.';

test('submitting reveals model answer and explanation', async ({ page }) => {
  await page.goto(story('default'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Your response').fill('plants turn light into sugar');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Model answer', { exact: true })).toBeVisible();
  await expect(canvas.getByText(MODEL_ANSWER, { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toBeVisible();
});

test('WithoutExplanation story reveals without Explanation', async ({ page }) => {
  await page.goto(story('without-explanation'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Your response').fill('an answer');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText(MODEL_ANSWER, { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toHaveCount(0);
});
