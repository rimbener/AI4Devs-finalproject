const { test, expect } = require('@playwright/test');

// Title 'Templates/Matching' → slug 'templates-matching'.
const story = (name) => `/?path=/story/templates-matching--${name}`;

/** testID is `matching-item-<id>--<state>`; locate by id prefix for clicks. */
const item = (canvas, id) => canvas.locator(`[data-testid^="matching-item-${id}--"]`);

const clickItem = async (canvas, id) => {
  await item(canvas, id).click();
};

const expectState = async (canvas, id, state) => {
  await expect(canvas.getByTestId(`matching-item-${id}--${state}`)).toBeVisible();
};

// Interactive drives live select → pair → release → submit → feedback (@s2,@s3,@s6,@s7,@s8,@s9,@s10).
test('tapping an unpaired item marks it pending then forms a pair with the opposite column', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  const submit = canvas.getByText('Submit', { exact: true });

  await expectState(canvas, 'l1', 'idle');
  await clickItem(canvas, 'l1'); // France
  await expectState(canvas, 'l1', 'pending');

  await clickItem(canvas, 'r1'); // Paris
  await expectState(canvas, 'l1', 'paired');
  await expectState(canvas, 'r1', 'paired');
  await expectState(canvas, 'l2', 'idle');
  // Submit stays hidden while unpaired remain (@s7).
  await expect(submit).toHaveCount(0);
});

test('tapping a paired item releases the pair before submit', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'l1');
  await clickItem(canvas, 'r1');
  await expectState(canvas, 'l1', 'paired');
  await expectState(canvas, 'r1', 'paired');

  await clickItem(canvas, 'l1'); // release (@s6)
  await expectState(canvas, 'l1', 'idle');
  await expectState(canvas, 'r1', 'idle');

  // Can re-pair after release.
  await clickItem(canvas, 'l1');
  await clickItem(canvas, 'r1');
  await expectState(canvas, 'l1', 'paired');
  await expectState(canvas, 'r1', 'paired');
});

test('Submit stays hidden until every item is paired, then appears and submits', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await expect(submit).toHaveCount(0);

  await clickItem(canvas, 'l1');
  await clickItem(canvas, 'r1');
  // Still unpaired remain — no Submit to press (@s7).
  await expect(submit).toHaveCount(0);
  await expect(canvas.getByText('Correct', { exact: true })).toHaveCount(0);

  await clickItem(canvas, 'l2');
  await clickItem(canvas, 'r2');
  await clickItem(canvas, 'l3');
  await clickItem(canvas, 'r3');

  await expect(submit).toBeVisible();
  await submit.click();
  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
});

test('submitting all-correct pairs shows correct banner, icons, and locks', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'l1');
  await clickItem(canvas, 'r1');
  await clickItem(canvas, 'l2');
  await clickItem(canvas, 'r2');
  await clickItem(canvas, 'l3');
  await clickItem(canvas, 'r3');
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('3 of 3 correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
  await expect(canvas.getByText('Submit', { exact: true })).toHaveCount(0);
});

test('submitting mixed pairs shows incorrect banner and mixed icons', async ({ page }) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await clickItem(canvas, 'l1');
  await clickItem(canvas, 'r1'); // correct
  await clickItem(canvas, 'l2');
  await clickItem(canvas, 'r3'); // incorrect
  await clickItem(canvas, 'l3');
  await clickItem(canvas, 'r2'); // incorrect
  await canvas.getByText('Submit', { exact: true }).click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  await expect(canvas.getByText('1 of 3 correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
  await expect(canvas.getByText('cancel', { exact: true }).first()).toBeVisible();
});
