const { test, expect } = require('@playwright/test');

// Title 'Templates/Flashcard' → slug 'templates-flashcard'.
const story = (name) => `/?path=/story/templates-flashcard--${name}`;

const PROMPT = 'What pigment absorbs light for photosynthesis?';
const ANSWER = 'Chlorophyll';

// Interactive drives live reveal → self-mark → lock (@s1,@s2,@s3,@s4,@s5).
test('Interactive: reveal shows the answer alongside the front', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText(PROMPT, { exact: true })).toBeVisible();
  await expect(canvas.getByText(ANSWER, { exact: true })).toHaveCount(0);
  await expect(canvas.getByText('Recalled', { exact: true })).toHaveCount(0);

  await canvas.getByText('Reveal answer', { exact: true }).click();

  await expect(canvas.getByText(PROMPT, { exact: true })).toBeVisible();
  await expect(canvas.getByText(ANSWER, { exact: true })).toBeVisible();
});

test('Interactive: both self-mark actions appear once revealed', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Reveal answer', { exact: true }).click();

  await expect(canvas.getByText('Recalled', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Not recalled', { exact: true })).toBeVisible();
});

test('Interactive: tapping Recalled locks the confirmation and disables both actions', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Reveal answer', { exact: true }).click();
  await canvas.getByText('Recalled', { exact: true }).click();

  await expect(canvas.getByText('Marked recalled', { exact: true })).toBeVisible();

  // Locked — re-tapping the other mark does not change the confirmed mark (@s5).
  await canvas.getByText('Not recalled', { exact: true }).click({ force: true });

  await expect(canvas.getByText('Marked recalled', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Marked not recalled', { exact: true })).toHaveCount(0);
});

test('Interactive: tapping Not recalled locks the confirmation and disables both actions', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Reveal answer', { exact: true }).click();
  await canvas.getByText('Not recalled', { exact: true }).click();

  await expect(canvas.getByText('Marked not recalled', { exact: true })).toBeVisible();

  // Locked — re-tapping the same mark again does not re-emit or change it (@s5).
  await canvas.getByText('Marked not recalled', { exact: true }).click({ force: true });

  await expect(canvas.getByText('Marked not recalled', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Marked recalled', { exact: true })).toHaveCount(0);
});
