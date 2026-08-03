const { test, expect } = require('@playwright/test');
const { ACTIVITY_FOOTER_COLLAPSE_TEST_ID } = require('@helsoft/activities/test-ids');

// Title 'Molecules/ActivityResultPanel' → slug 'molecules-activityresultpanel'.
const story = (name) => `/?path=/story/molecules-activityresultpanel--${name}`;

test('clicking Submit replaces it with the result content', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await expect(submit).toBeVisible();

  await submit.click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('3 of 3 correct', { exact: true })).toBeVisible();
  await expect(submit).toHaveCount(0);
});

test('the result panel collapses the explanation to the toggle and expands back', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByText('Submit', { exact: true }).click();
  await expect(canvas.getByText('Capitals match their countries.', { exact: true })).toBeVisible();

  const toggle = canvas.getByTestId(ACTIVITY_FOOTER_COLLAPSE_TEST_ID);
  await toggle.click();
  await expect(canvas.getByText('Capitals match their countries.', { exact: true })).toHaveCount(0);

  await toggle.click();
  await expect(canvas.getByText('Capitals match their countries.', { exact: true })).toBeVisible();
});
