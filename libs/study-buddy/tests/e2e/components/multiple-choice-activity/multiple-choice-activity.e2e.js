const { test, expect } = require('@playwright/test');

test('selecting the correct option grades correct and shows the explanation', async ({ page }) => {
  await page.goto('/?path=/story/features-multiplechoiceactivity--default');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Paris', { exact: true }).click();
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toBeVisible();
  await expect(
    canvas.getByText('Paris has been the capital of France since 987 AD.', { exact: true }),
  ).toBeVisible();
});

test('locks the attempt — every option becomes non-interactive once answered', async ({ page }) => {
  await page.goto('/?path=/story/features-multiplechoiceactivity--default');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Paris', { exact: true }).click();
  await canvas.getByText('Submit', { exact: true }).click();
  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();

  // The unselected option is genuinely disabled (not just visually) — Playwright's own
  // actionability check refuses a real click here, which is the behavior under test.
  await expect(canvas.getByText('Berlin', { exact: true })).toBeDisabled();

  // Forcing the tap through anyway must still leave the original (Paris) answer standing.
  await canvas.getByText('Berlin', { exact: true }).click({ force: true });
  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Incorrect', { exact: true })).toHaveCount(0);
});

test('WithoutExplanation story: an incorrect pick reveals the correct option, no explanation renders', async ({
  page,
}) => {
  await page.goto('/?path=/story/features-multiplechoiceactivity--without-explanation');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Berlin', { exact: true }).click();
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  // The correct option (Paris) is revealed alongside the learner's incorrect pick.
  await expect(canvas.getByText('Paris', { exact: true })).toBeVisible();
  await expect(canvas.getByText('Explanation', { exact: true })).toHaveCount(0);
});
