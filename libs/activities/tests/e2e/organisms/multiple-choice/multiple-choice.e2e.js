const { test, expect } = require('@playwright/test');

// Title 'Templates/MultipleChoice' → slug 'templates-multiplechoice'.
const story = (name) => `/?path=/story/templates-multiplechoice--${name}`;

// Organism owns selection + grading — Interactive story is a live unanswered instance.
// Submit stays hidden until an option is picked, then grades on press.
test('selecting the correct option reveals Submit and shows the correct feedback', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await expect(submit).toHaveCount(0);

  await canvas.getByText('Paris', { exact: true }).click();
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(canvas.getByText('Correct', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
});

test('selecting an incorrect option and submitting shows incorrect feedback and reveals the correct option', async ({
  page,
}) => {
  await page.goto(story('interactive'));
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  const submit = canvas.getByText('Submit', { exact: true });
  await canvas.getByText('Berlin', { exact: true }).click();
  await submit.click();

  await expect(canvas.getByText('Incorrect', { exact: true })).toBeVisible();
  await expect(canvas.getByText('check_circle', { exact: true }).first()).toBeVisible();
  await expect(canvas.getByText('cancel', { exact: true }).first()).toBeVisible();
});
