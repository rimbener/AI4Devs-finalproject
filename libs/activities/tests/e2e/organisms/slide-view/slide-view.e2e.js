const { test, expect } = require('@playwright/test');

// Story decorators share the URL mock; parallel stories would overwrite its active value.
test.describe.configure({ mode: 'serial' });

// Title 'Organisms/SlideView' → slug 'organisms-slideview'.
const story = (name) => `/?path=/story/organisms-slideview--${name}`;

const preview = async (page) => {
  await page.goto(story('split-instructional'));
  return page.frameLocator('iframe[title="storybook-preview-iframe"]');
};

test('split instructional story has separate image and body panes', async ({ page }) => {
  const canvas = await preview(page);

  await expect(canvas.getByText('Photosynthesis', { exact: true })).toBeVisible();
  await expect(canvas.getByTestId('slide-split-row')).toBeVisible();
  await expect(canvas.getByTestId('slide-image-pane')).toBeVisible();
  await expect(canvas.getByTestId('slide-body-scroll')).toBeVisible();
  await expect(canvas.getByTestId('slide-image-expand-control')).toBeVisible();
});

test('split story preserves title, image, body source order', async ({ page }) => {
  const canvas = await preview(page);
  const title = canvas.getByText('Photosynthesis', { exact: true });
  const imagePane = canvas.getByTestId('slide-image-pane');
  const bodyPane = canvas.getByTestId('slide-body-pane');

  await expect(title).toBeVisible();
  await expect(imagePane).toBeVisible();
  await expect(bodyPane).toBeVisible();
  await expect(title.locator('xpath=following::*[@data-testid="slide-image-pane"]')).toHaveCount(1);
  await expect(imagePane.locator('xpath=following::*[@data-testid="slide-body-pane"]')).toHaveCount(
    1,
  );
});

[
  'split-multiple-choice',
  'split-fill-in-the-blank',
  'split-matching',
  'split-flashcard',
  'split-open-ended',
].forEach((storyName) => {
  test(`${storyName} story renders the shared row`, async ({ page }) => {
    await page.goto(story(storyName));
    const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

    await expect(canvas.getByTestId('slide-split-row')).toBeVisible();
    await expect(canvas.getByTestId('slide-body-scroll')).toBeVisible();
  });
});

test('portrait viewport stacks the portrait image story', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const canvas = await preview(page);

  await expect(canvas.getByTestId('slide-split-row')).toHaveCount(0);
  await expect(canvas.getByTestId('slide-image-container')).toBeVisible();
});

test('Slide view instructional story loads', async ({ page }) => {
  await page.goto(story('instructional'));

  const iframe = page.locator('iframe[title="storybook-preview-iframe"]');
  await expect(iframe).toBeVisible();

  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  await expect(canvas.getByText('Photosynthesis', { exact: true })).toBeVisible();
  await expect(
    canvas.getByText('Plants convert light into chemical energy.', { exact: true }),
  ).toBeVisible();
});

test('Slide view multiple choice story loads', async ({ page }) => {
  await page.goto(story('multiple-choice'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await expect(canvas.getByText('Capitals', { exact: true })).toBeVisible();
  await expect(canvas.getByText('What is the capital of France?', { exact: true })).toBeVisible();
});
