const { test, expect } = require('@playwright/test');
const {
  LESSON_PLAYER_NAV_NEXT_TEST_ID,
  FLASHCARD_REVEAL_TEST_ID,
  FLASHCARD_ANSWER_TEST_ID,
  FLASHCARD_MARK_RECALLED_TEST_ID,
  MULTIPLE_CHOICE_SUBMIT_TEST_ID,
} = require('@helsoft/activities/test-ids');
const {
  RESULTS_BACK_HOME_TEST_ID,
  LESSON_LIST_TEST_ID,
  lessonListItemTitleTestId,
} = require('@helsoft/components/test-ids');
const {
  login,
  chooseFileAndExtract,
  generateLesson,
  openInPlayer,
  multipleChoiceOptionTestId,
  stageFixtureCopy,
} = require('./helpers/golden-path');

// @s4-@s5 (golden path) — drive the mocked deck's one Flashcard (reveal → self-mark) and one
// MultipleChoice (select the correct option → submit) slide via the nav-next button, then reach
// Results and go back home. The deck is fixed (helpers/golden-path.js's mockLessonGeneration), so
// slide positions/content are known ahead of time — no need to search for activity types.
test('playing a generated lesson: flashcard, multiple choice, results, back home', async ({
  page,
}) => {
  await login(page);

  const fixturePath = stageFixtureCopy('lesson-player');
  await chooseFileAndExtract(page, fixturePath);
  const lesson = await generateLesson(page);
  await openInPlayer(page);

  const nextLocator = page.getByTestId(LESSON_PLAYER_NAV_NEXT_TEST_ID);

  // Slide 0 — instructional, no interaction.
  await nextLocator.click();

  // Slide 1 — Flashcard: reveal, then self-mark.
  await page.getByTestId(FLASHCARD_REVEAL_TEST_ID).click();
  await expect(page.getByTestId(FLASHCARD_ANSWER_TEST_ID)).toBeVisible();

  const markRecalledLocator = page.getByTestId(FLASHCARD_MARK_RECALLED_TEST_ID);
  const beforeLabel = await markRecalledLocator.textContent();
  await markRecalledLocator.click();
  await expect(markRecalledLocator).not.toHaveText(beforeLabel ?? '');

  await nextLocator.click();

  // Slide 2 — instructional, no interaction.
  await nextLocator.click();

  // Slide 3 — MultipleChoice: select the known-correct option, submit.
  const multipleChoiceSlide = lesson.slides[3];
  await page.getByTestId(multipleChoiceOptionTestId(multipleChoiceSlide.correctOptionId)).click();
  await page.getByTestId(MULTIPLE_CHOICE_SUBMIT_TEST_ID).click();
  await expect(page.getByTestId(MULTIPLE_CHOICE_SUBMIT_TEST_ID)).toBeHidden();

  await nextLocator.click();

  // Results.
  const backHomeLocator = page.getByTestId(RESULTS_BACK_HOME_TEST_ID);
  await expect(backHomeLocator).toBeVisible();
  await backHomeLocator.click();

  // "Back home" (LessonPlayer screen wiring) routes to the Home tab (SavedLessons' lesson list),
  // which shows the lesson just played (mocked in the list-query route too — see
  // mockLessonGeneration).
  await expect(page.getByTestId(LESSON_LIST_TEST_ID)).toBeVisible();
  await expect(page.getByTestId(lessonListItemTitleTestId(lesson.lessonId))).toHaveText(
    lesson.title,
  );
});
