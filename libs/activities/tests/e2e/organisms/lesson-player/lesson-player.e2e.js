const { test, expect } = require('@playwright/test');

// Title 'Organisms/LessonPlayer' → slug 'organisms-lessonplayer'.
const story = (name) => `/?path=/story/organisms-lessonplayer--${name}`;

// The lesson player now renders a second (footer) Next and the results screen has its own
// Back home control, so navigation targets the header nav controls by testID (same choice
// the app e2e made).
const next = (canvas) => canvas.getByTestId('lesson-player-nav-next');
const back = (canvas) => canvas.getByTestId('lesson-player-nav-back');

// @s2/@s20 — Next advances; Back from results returns to last content slide.
test('Lesson player navigates to results and back', async ({ page }) => {
  await page.goto(story('first-slide'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Welcome', { exact: true })).toBeVisible();

  // 4 content slides → results is step 5
  for (let i = 0; i < 4; i++) {
    await next(canvas).click();
  }

  await expect(canvas.getByText('Slide 5 of 5', { exact: true })).toBeVisible();
  await expect(back(canvas)).toBeVisible();

  await back(canvas).click();
  await expect(canvas.getByText('Summary', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Slide 4 of 5', { exact: true })).toBeVisible();
});

// @s19 — navigation + progress usable on a mobile viewport.
test('Lesson player is usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(story('first-slide'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Welcome', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Slide 1 of 5', { exact: true })).toBeVisible();
  await expect(next(canvas)).toBeVisible();
  await next(canvas).click();
  await expect(canvas.getByText('France', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Slide 2 of 5', { exact: true })).toBeVisible();
});

// @s19 — navigation + progress usable on a web viewport.
test('Lesson player is usable on a web viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(story('first-slide'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Welcome', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Slide 1 of 5', { exact: true })).toBeVisible();
  await expect(next(canvas)).toBeVisible();
  await next(canvas).click();
  await expect(canvas.getByText('France', { exact: true })).toBeVisible();
});
