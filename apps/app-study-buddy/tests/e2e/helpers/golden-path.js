const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { expect } = require('@playwright/test');
const {
  LOGIN_EMAIL_FIELD_TEST_ID,
  LOGIN_PASSWORD_FIELD_TEST_ID,
  LOGIN_SUBMIT_BUTTON_TEST_ID,
} = require('@helsoft/logging-in-out/test-ids');
const { NEW_LESSON_DIALOG_CHOOSE_FILE_TEST_ID } = require('@helsoft/study-buddy/test-ids');
const {
  LESSON_GENERATION_GENERATE_TEST_ID,
  LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID,
} = require('@helsoft/components/test-ids');
const {
  LESSON_PLAYER_TEST_ID,
  multipleChoiceOptionTestId,
} = require('@helsoft/activities/test-ids');

// Seeded entitlement account from supabase/seed.sql — plan `use_platform_key = true`
// (`canCreate` true, generation not blocked by ApiKeyGate).
const LOGIN_EMAIL = 'test@paid.com';
const LOGIN_PASSWORD = 'test123';
const LOGIN_USER_ID = '55555555-5555-5555-5555-555555555555';

const MOCK_LESSON_ID = '99999999-9999-4999-8999-999999999999';

/** A fixed, hand-authored deck standing in for a real `generate-lesson` response — see
 * `mockLessonGeneration` below for why generation is mocked rather than calling the real
 * (paid, slow, occasionally flaky) Groq-backed edge function. Position 0/2 are instructional
 * (no interaction, just a Next click); 1 is the Flashcard, 3 is the MultipleChoice — matching
 * the shape `libs/types/src/lesson.ts`'s `Slide` union expects (camelCase, `image` omitted when
 * absent). Extraction (PDF → text/images via local mupdf) stays real — no external cost there. */
const buildMockLesson = () => ({
  lessonId: MOCK_LESSON_ID,
  title: 'Introduction to Photosynthesis',
  composition: 'both',
  slides: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      lessonId: MOCK_LESSON_ID,
      kind: 'instructional',
      title: 'Introduction to Photosynthesis',
      content: 'Photosynthesis converts light energy into chemical energy stored in glucose.',
      position: 0,
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      lessonId: MOCK_LESSON_ID,
      kind: 'activity',
      activityType: 'flashcard',
      title: 'Key term',
      content: 'What pigment absorbs light for photosynthesis?',
      position: 1,
      back: 'Chlorophyll',
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      lessonId: MOCK_LESSON_ID,
      kind: 'instructional',
      title: 'Light reactions',
      content: 'The light reactions take place in the thylakoid membranes.',
      position: 2,
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      lessonId: MOCK_LESSON_ID,
      kind: 'activity',
      activityType: 'multiple-choice',
      title: 'Quick check',
      content: 'Which gas do plants release during photosynthesis?',
      position: 3,
      options: [
        { id: 'a', label: 'Oxygen' },
        { id: 'b', label: 'Nitrogen' },
        { id: 'c', label: 'Carbon dioxide' },
      ],
      correctOptionId: 'a',
    },
  ],
});

const FIXTURE_PATH = path.join(__dirname, '..', '..', 'fixtures', 'golden-path.pdf');

/** Copies the committed fixture PDF to a uniquely-named temp file so each e2e file's upload
 * produces a distinct filename — the app inserts a new `pdf_documents` row per upload with no
 * uniqueness constraint, so row locators keyed by filename (see pdf-document-list-item) would be
 * ambiguous if two files in the same suite run uploaded the same filename. */
const stageFixtureCopy = (tag) => {
  const dest = path.join(os.tmpdir(), `golden-path-${tag}.pdf`);
  fs.copyFileSync(FIXTURE_PATH, dest);
  return dest;
};

const login = async (page) => {
  await page.goto('/login');
  await page.getByTestId(LOGIN_EMAIL_FIELD_TEST_ID).fill(LOGIN_EMAIL);
  await page.getByTestId(LOGIN_PASSWORD_FIELD_TEST_ID).fill(LOGIN_PASSWORD);
  await page.getByTestId(LOGIN_SUBMIT_BUTTON_TEST_ID).click();
  // The login screen unmounts once `Stack.Protected` swaps to the authenticated stack.
  await expect(page.getByTestId(LOGIN_EMAIL_FIELD_TEST_ID)).toBeHidden();
};

/** Clicks the PDF list's "Choose file" trigger and stages the fixture on the real file-chooser
 * expo-document-picker's web implementation opens, then waits for extraction to succeed (the
 * dialog auto-advances from the upload step straight to the generate step on success).
 *
 * The trigger click is a genuine user gesture, so `input.dispatchEvent(new MouseEvent('click'))`
 * inside `getDocumentAsync` actually opens the browser's native file chooser (Chromium
 * auto-cancels it in headless mode almost immediately) rather than merely toggling a plain
 * `<input>` element — `page.locator('input[type="file"]').setInputFiles()` loses that race
 * ~100% of the time. `waitForEvent('filechooser')` intercepts the chooser directly instead. */
const chooseFileAndExtract = async (page, fixturePath) => {
  await page.goto('/pdf-files');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByTestId(NEW_LESSON_DIALOG_CHOOSE_FILE_TEST_ID).click(),
  ]);
  await fileChooser.setFiles(fixturePath);
  await expect(page.getByTestId(LESSON_GENERATION_GENERATE_TEST_ID)).toBeVisible({
    timeout: 15000,
  });
};

/** Intercepts both real network calls generation triggers, so the suite never places a real
 * (paid) call to the AI provider:
 *  1. `POST .../functions/v1/generate-lesson` — the edge function itself calls Groq and persists
 *     the lesson; mocked to return a fixed deck instantly instead.
 *  2. `GET .../rest/v1/lessons?...id=eq.<id>...` — the player screen re-fetches the lesson by id
 *     via a *separate* direct Postgres read (`LessonsDao.getLessonById`), not through the edge
 *     function response — mocking only #1 leaves the player screen fetching a lesson that was
 *     never actually persisted. Only the single-lesson-by-id shape is intercepted; other
 *     `lessons` queries (e.g. the Home tab's saved-lessons list) `route.continue()` through to
 *     the real local Supabase stack untouched.
 * Returns the mocked deck so a test can assert against known slide content/positions. */
const mockLessonGeneration = async (page) => {
  const lesson = buildMockLesson();

  await page.route('**/functions/v1/generate-lesson', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lesson),
    });
  });

  await page.route('**/rest/v1/lessons*', async (route) => {
    const url = new URL(route.request().url());
    const idFilter = url.searchParams.get('id');

    if (idFilter === `eq.${lesson.lessonId}`) {
      // Player screen's by-id read (LessonsDao.getLessonById) — single object, full slides.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: lesson.lessonId,
          title: lesson.title,
          slides: lesson.slides,
          created_at: '2026-01-01T00:00:00.000Z',
          user_id: LOGIN_USER_ID,
        }),
      });
      return;
    }

    if (idFilter === null && url.searchParams.get('select')?.includes('title')) {
      // Home tab's saved-lessons list (SavedLessons/useLessons) — array, list-row shape only.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: lesson.lessonId, title: lesson.title, created_at: '2026-01-01T00:00:00.000Z' },
        ]),
      });
      return;
    }

    await route.continue();
  });

  return lesson;
};

/** Presses Generate and waits for the (mocked) result — see `mockLessonGeneration`. */
const generateLesson = async (page) => {
  const lesson = await mockLessonGeneration(page);
  await page.getByTestId(LESSON_GENERATION_GENERATE_TEST_ID).click();
  await expect(page.getByTestId(LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID)).toBeVisible({
    timeout: 10000,
  });
  return lesson;
};

const openInPlayer = async (page) => {
  await page.getByTestId(LESSON_GENERATION_OPEN_IN_PLAYER_TEST_ID).click();
  await expect(page.getByTestId(LESSON_PLAYER_TEST_ID)).toBeVisible({ timeout: 15000 });
};

module.exports = {
  LOGIN_EMAIL,
  LOGIN_PASSWORD,
  FIXTURE_PATH,
  stageFixtureCopy,
  login,
  chooseFileAndExtract,
  mockLessonGeneration,
  generateLesson,
  multipleChoiceOptionTestId,
  openInPlayer,
};
