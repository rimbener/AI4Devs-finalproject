const { test, expect } = require('@playwright/test');

// Title 'Organisms/LessonGenerationPanel' → slug 'organisms-lessongenerationpanel'.
const story = (name) => `/?path=/story/organisms-lessongenerationpanel--${name}`;

// @s2 — the composition picker interaction itself: choosing a different option actually
// changes the selected value (not just static markup).
test('InteractivePicker story updates the selected composition when a different option is chosen', async ({
  page,
}) => {
  await page.goto(story('interactive-picker'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.locator('text=Instructional only').click();

  const option = canvas.locator('text=Instructional only').first();
  const radio = option.locator('xpath=ancestor::*[@aria-checked][1]');
  await expect(radio).toHaveAttribute('aria-checked', 'true');
});
