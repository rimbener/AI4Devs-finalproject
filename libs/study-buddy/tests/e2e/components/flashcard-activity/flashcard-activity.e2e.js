const { test, expect } = require('@playwright/test');

// Title 'Features/FlashcardActivity' → slug 'features-flashcardactivity'.
const story = (name) => `/?path=/story/features-flashcardactivity--${name}`;

const ANSWER = 'Chlorophyll';

test('revealing shows answer, self-mark actions, and explanation', async ({ page }) => {
  await page.goto(story('default'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Reveal answer', { exact: true }).click();

  await expect(canvas.getByText(ANSWER, { exact: true })).toBeVisible();
  await expect(canvas.getByText('Recalled', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Not recalled', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toBeVisible();
});

test('WithoutExplanation story reveals without Explanation', async ({ page }) => {
  await page.goto(story('without-explanation'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Reveal answer', { exact: true }).click();

  await expect(canvas.getByText(ANSWER, { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toHaveCount(0);
});
