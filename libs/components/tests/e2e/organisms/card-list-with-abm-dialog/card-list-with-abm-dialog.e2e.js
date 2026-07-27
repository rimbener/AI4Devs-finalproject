const { test, expect } = require('@playwright/test');

// Title 'Organisms/CardListWithABMDialog' → slug 'organisms-cardlistwithabmdialog'.
const story = (name) => `/?path=/story/organisms-cardlistwithabmdialog--${name}`;

// @s17 — tapping the add button notifies the caller (onAddPress).
test('tapping the add button calls onAddPress', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.locator('text=Added 0 times')).toBeVisible();

  await canvas.locator('text=Add flashcard').click();
  await expect(canvas.locator('text=Added 1 times')).toBeVisible();

  await canvas.locator('text=Add flashcard').click();
  await expect(canvas.locator('text=Added 2 times')).toBeVisible();
});

// @s5/@s7 — edit icon opens the edit dialog; submitting it closes the dialog again.
// Populated's rows render edit before remove, so `.first()` on the shared interim
// accessible label (slice-1) targets the edit icon.
test('tapping the edit icon opens the edit dialog; submitting it closes the dialog', async ({
  page,
}) => {
  await page.goto(story('populated'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Mitochondria flashcard').first().click();
  await expect(canvas.locator('text=Edit flashcard')).toBeVisible();
  await expect(canvas.locator('text=Edit form for Mitochondria')).toBeVisible();

  await canvas.locator('text=Save').click();
  await expect(canvas.locator('text=Edit flashcard')).toHaveCount(0);
});

// @s6/@s10 — remove icon opens the remove-confirmation dialog; canceling closes it
// without acting. `.last()` targets the remove icon (rendered after edit in each row).
test('tapping the remove icon opens the remove dialog; canceling closes it', async ({ page }) => {
  await page.goto(story('populated'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Photosynthesis flashcard').last().click();
  await expect(canvas.locator('text=Remove flashcard')).toBeVisible();
  await expect(
    canvas.locator('text=Remove "Photosynthesis"? This cannot be undone.'),
  ).toBeVisible();

  await canvas.locator('text=Keep it').click();
  await expect(canvas.locator('text=Remove flashcard')).toHaveCount(0);
});
