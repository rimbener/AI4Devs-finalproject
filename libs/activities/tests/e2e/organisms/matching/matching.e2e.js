const { test, expect } = require('@playwright/test');

// Title 'Organisms/Matching' → slug 'organisms-matching'.
const story = (name) => `/?path=/story/organisms-matching--${name}`;

const clickItem = async (canvas, label) => {
  await canvas.getByText(label, { exact: true }).click();
};

// Interactive drives live select → pair → release → submit → feedback (@s2,@s3,@s6,@s7,@s8,@s9,@s10).
test('tapping an unpaired item marks it pending then forms a pair with the opposite column', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris');

  // Pair formed — Submit still disabled while unpaired remain (@s3/@s7).
  await expect(canvas.getByText('Submit', { exact: true })).toBeVisible();
  await expect(canvas.getByText('All correct!', { exact: true })).toHaveCount(0);
});

test('tapping a paired item releases the pair before submit', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris');
  await clickItem(canvas, 'France'); // release (@s6)

  // After release, can re-pair — no result yet.
  await expect(canvas.getByText('All correct!', { exact: true })).toHaveCount(0);
  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris');
});

test('Submit stays disabled until every item is paired, then enables', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await expect(submit).toBeVisible();

  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris');
  // Still unpaired remain — clicking Submit should not show a result (@s7).
  await submit.click({ force: true });
  await expect(canvas.getByText('All correct!', { exact: true })).toHaveCount(0);

  await clickItem(canvas, 'Germany');
  await clickItem(canvas, 'Berlin');
  await clickItem(canvas, 'Italy');
  await clickItem(canvas, 'Rome');

  await submit.click();
  await expect(canvas.getByText('All correct!', { exact: true })).toBeVisible();
});

test('submitting all-correct pairs shows correct banner, icons, and locks', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris');
  await clickItem(canvas, 'Germany');
  await clickItem(canvas, 'Berlin');
  await clickItem(canvas, 'Italy');
  await clickItem(canvas, 'Rome');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('All correct!', { exact: true })).toBeVisible();
  await expect(canvas.getByText('3 of 3 correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
  await expect(canvas.getByText('Submit', { exact: true })).toHaveCount(0);
});

test('submitting mixed pairs shows incorrect banner and mixed icons', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'France');
  await clickItem(canvas, 'Paris'); // correct
  await clickItem(canvas, 'Germany');
  await clickItem(canvas, 'Rome'); // incorrect
  await clickItem(canvas, 'Italy');
  await clickItem(canvas, 'Berlin'); // incorrect
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Not quite', { exact: true })).toBeVisible();
  await expect(canvas.getByText('1 of 3 correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
  await expect(canvas.getByText('cancel', { exact: true }).first()).toBeVisible();
});
