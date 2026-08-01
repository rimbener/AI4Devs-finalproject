const { test, expect } = require('@playwright/test');

// Title 'Molecules/ActivitySubmitResult' → slug 'molecules-activitysubmitresult'.
const story = (name) => `/?path=/story/molecules-activitysubmitresult--${name}`;

test('clicking Submit replaces it with the result content', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await expect(submit).toBeVisible();

  await submit.click();

  await expect(canvas.getByText('All correct!', { exact: true })).toBeVisible();
  await expect(submit).toHaveCount(0);
});
