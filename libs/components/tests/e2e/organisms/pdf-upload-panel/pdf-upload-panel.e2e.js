const { test, expect } = require('@playwright/test');

// Title 'Organisms/PdfUploadPanel' → slug 'organisms-pdfuploadpanel'.
const story = (name) => `/?path=/story/organisms-pdfuploadpanel--${name}`;

// @s13/@s16 — the retry *interaction* itself: pressing "Try again" actually re-triggers the
// upload flow (here, transitions the demo back to the Loading state), not just static markup.
test('InteractiveRetry story transitions to the loading state when the retry affordance is pressed', async ({
  page,
}) => {
  await page.goto(story('interactive-retry'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Something went wrong while reading your PDF')).toBeVisible();

  await canvas.locator('text=Try again').click();

  await expect(canvas.locator('text=Extracting…')).toBeVisible();
});
