const { test, expect } = require('@playwright/test');
const { LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID } = require('@helsoft/components/test-ids');
const {
  login,
  chooseFileAndExtract,
  generateLesson,
  stageFixtureCopy,
} = require('./helpers/golden-path');

// @s2-@s3 (golden path) — choosing the fixture PDF extracts it (real, local mupdf extraction),
// then pressing Generate lands on the ready-to-play state. Generation itself is mocked at the
// network boundary (see helpers/golden-path.js's mockLessonGeneration) — no real, paid AI call.
test('uploading a PDF and generating produces an open-in-player lesson', async ({ page }) => {
  await login(page);

  const fixturePath = stageFixtureCopy('upload-and-generate');
  await chooseFileAndExtract(page, fixturePath);
  await generateLesson(page);

  await expect(page.getByTestId(LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID)).toBeVisible();
});
