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
// getEditAccessibilityLabel builds a distinct name per card, so no .first()/.last() needed.
test('tapping the edit icon opens the edit dialog; submitting it closes the dialog', async ({
  page,
}) => {
  await page.goto(story('populated'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Edit Mitochondria flashcard').click();
  await expect(canvas.locator('text=Edit flashcard')).toBeVisible();
  await expect(canvas.locator('text=Edit form for Mitochondria')).toBeVisible();

  await canvas.locator('text=Save').click();
  await expect(canvas.locator('text=Edit flashcard')).toHaveCount(0);
});

// @s6/@s10 — remove icon opens the remove-confirmation dialog; canceling closes it
// without acting.
test('tapping the remove icon opens the remove dialog; canceling closes it', async ({ page }) => {
  await page.goto(story('populated'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.getByLabel('Remove Photosynthesis flashcard').click();
  await expect(canvas.locator('text=Remove flashcard')).toBeVisible();
  await expect(
    canvas.locator('text=Remove "Photosynthesis"? This cannot be undone.'),
  ).toBeVisible();

  await canvas.locator('text=Keep it').click();
  await expect(canvas.locator('text=Remove flashcard')).toHaveCount(0);
});

// @s11 — while isSubmitting is true, the edit dialog can't be dismissed via scrim tap or Escape.
test('scrim tap and Escape do nothing while the edit dialog is submitting', async ({ page }) => {
  await page.goto(story('edit-dialog-submitting'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  const preview = await page.locator('iframe[title="storybook-preview-iframe"]').boundingBox();

  await expect(canvas.locator('text=Edit flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();

  // Scrim tap — click a corner of the modal overlay, away from the centered dialog surface.
  await page.mouse.click(preview.x + 10, preview.y + 10);
  await expect(canvas.locator('text=Edit flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();

  // Escape — no Cancel/Save button is rendered while submitting, so no visible dismiss control.
  await page.keyboard.press('Escape');
  await expect(canvas.locator('text=Edit flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await expect(canvas.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
});

// @s12 — while isSubmitting is true, the remove dialog can't be dismissed via scrim tap or Escape.
test('scrim tap and Escape do nothing while the remove dialog is submitting', async ({ page }) => {
  await page.goto(story('remove-dialog-submitting'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  const preview = await page.locator('iframe[title="storybook-preview-iframe"]').boundingBox();

  await expect(canvas.locator('text=Remove flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();

  await page.mouse.click(preview.x + 10, preview.y + 10);
  await expect(canvas.locator('text=Remove flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(canvas.locator('text=Remove flashcard')).toBeVisible();
  await expect(canvas.locator('text=Saving…')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
  await expect(canvas.getByRole('button', { name: 'Keep it', exact: true })).toHaveCount(0);
});
