jest.mock('../dao/lesson-generation.dao', () => ({
  LessonGenerationDao: { generateLesson: jest.fn() },
}));

import type { GeneratedLesson } from '@helsoft/types';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import { LessonGenerationDao } from '../dao/lesson-generation.dao';
import { LessonGenerationService } from './lesson-generation.service';

const dao = LessonGenerationDao as jest.Mocked<typeof LessonGenerationDao>;

/** A `FunctionsHttpError`-shaped rejection carrying the Edge Function's `{ errorCode }` JSON
 * body, unread until `.context.json()` is called (mirrors `pdf-extraction.service.test.ts`'s
 * `httpErrorWithBody`). */
const httpErrorWithBody = (body: unknown): FunctionsHttpError =>
  new FunctionsHttpError({ json: () => Promise.resolve(body) });

describe('LessonGenerationService', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s3/@s6 — a valid request from an authenticated caller is forwarded to the DAO as-is
  // (composition included) and its typed deck is returned unchanged.
  it('delegates a valid request to the DAO and returns the ordered typed deck', async () => {
    const lesson: GeneratedLesson = {
      lessonId: 'lesson-1',
      title: 'Photosynthesis',
      composition: 'both',
      slides: [],
    };
    dao.generateLesson.mockResolvedValue(lesson);

    const result = await LessonGenerationService.generate(
      { documentId: 'doc-1', composition: 'both' },
      'user-1',
    );

    expect(dao.generateLesson).toHaveBeenCalledWith({ documentId: 'doc-1', composition: 'both' });
    expect(result).toBe(lesson);
  });

  // @s12 — optional provider/model are forwarded unchanged to the Edge invoke body.
  it('forwards optional provider and model to the DAO unchanged', async () => {
    const lesson: GeneratedLesson = {
      lessonId: 'lesson-1',
      title: 'Photosynthesis',
      composition: 'both',
      slides: [],
    };
    dao.generateLesson.mockResolvedValue(lesson);

    await LessonGenerationService.generate(
      {
        documentId: 'doc-1',
        composition: 'both',
        provider: 'openai',
        model: 'gpt-5.6-luna',
      },
      'user-1',
    );

    expect(dao.generateLesson).toHaveBeenCalledWith({
      documentId: 'doc-1',
      composition: 'both',
      provider: 'openai',
      model: 'gpt-5.6-luna',
    });
  });

  // Guard rail — an empty/missing userId never reaches the DAO; rejects with the typed
  // unauthenticated code (mirrors PdfExtractionService's own guard).
  it('rejects with unauthenticated and never calls the DAO when userId is empty', async () => {
    await expect(
      LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, ''),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'LessonGenerationService: unauthenticated',
    });
    expect(dao.generateLesson).not.toHaveBeenCalled();
  });

  // Guard rail — a missing documentId never reaches the DAO; rejects with document_not_ready.
  it('rejects with document_not_ready and never calls the DAO when documentId is empty', async () => {
    await expect(
      LessonGenerationService.generate({ documentId: '', composition: 'both' }, 'user-1'),
    ).rejects.toMatchObject({ code: 'document_not_ready' });
    expect(dao.generateLesson).not.toHaveBeenCalled();
  });

  // @s12 — a deck with some slides degraded to text-only (no image) is still just a successful
  // deck to this layer; it passes through unchanged, never treated as an error.
  it('returns a deck unchanged even when some of its slides carry no image (degraded to text-only)', async () => {
    const lesson: GeneratedLesson = {
      lessonId: 'lesson-1',
      title: 'Photosynthesis',
      composition: 'both',
      slides: [
        {
          id: 's1',
          lessonId: 'lesson-1',
          title: 'Intro',
          content: 'Welcome',
          position: 0,
          kind: 'instructional',
        },
      ],
    };
    dao.generateLesson.mockResolvedValue(lesson);

    const result = await LessonGenerationService.generate(
      { documentId: 'doc-1', composition: 'both' },
      'user-1',
    );

    expect(result).toBe(lesson);
  });

  // task-13, @s15 — every DAO-thrown cause is normalized into the typed GenerationErrorCode
  // union, mirroring PdfExtractionService.normalizeExtractionError; the UI never branches on a
  // raw Supabase/function error. `provider_disabled` (task-9, @s12) added to the same table —
  // the 422 wire code for a BYOK request naming a currently-disabled provider.
  describe('server error normalization (task-13)', () => {
    it.each([
      ['invalid_key'],
      ['invalid_model'],
      ['rate_limited'],
      ['timeout'],
      ['generation_failed'],
      ['document_not_ready'],
      ['missing_key'],
      ['platform_key_unavailable'],
      ['persist_failed'],
      ['provider_disabled'],
    ] as const)('normalizes a %s server error', async (errorCode) => {
      dao.generateLesson.mockRejectedValue(httpErrorWithBody({ errorCode }));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: errorCode });
    });

    // task-10, @s13 — an unknown-provider 422 (provider id absent from the catalog) still maps
    // to invalid_model after task-9's provider_disabled widening — the two 422 codes must never
    // be confused for one another.
    it('maps an unknown-provider 422 to invalid_model, never provider_disabled (@s13)', async () => {
      dao.generateLesson.mockRejectedValue(httpErrorWithBody({ errorCode: 'invalid_model' }));

      await expect(
        LessonGenerationService.generate(
          { documentId: 'doc-1', composition: 'both', provider: 'groq', model: 'unknown-model' },
          'user-1',
        ),
      ).rejects.toMatchObject({ code: 'invalid_model' });
    });

    // Defensive — a missing/unrecognized errorCode in the server body never leaks a raw shape;
    // it falls back to the generic generation_failed code.
    it('falls back to generation_failed when the server error body has no known errorCode', async () => {
      dao.generateLesson.mockRejectedValue(httpErrorWithBody({ errorCode: 'not_a_real_code' }));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'generation_failed' });
    });

    it('falls back to generation_failed when the server error body itself resolves to null', async () => {
      dao.generateLesson.mockRejectedValue(httpErrorWithBody(null));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'generation_failed' });
    });

    // Same as the null-body case above but with `undefined` — proves the optional-chaining read
    // of `errorCode` off a nullish body never throws through to the caller either way.
    it('falls back to generation_failed when the server error body itself resolves to undefined', async () => {
      dao.generateLesson.mockRejectedValue(httpErrorWithBody(undefined));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'generation_failed' });
    });

    it('falls back to generation_failed when the server error body cannot be parsed', async () => {
      dao.generateLesson.mockRejectedValue(
        new FunctionsHttpError({ json: () => Promise.reject(new Error('invalid JSON')) }),
      );

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'generation_failed' });
    });

    // A transport-level failure reaching the function at all (offline, DNS, etc.) is surfaced as
    // network_error, distinct from a typed server response.
    it('normalizes a transport-level FunctionsFetchError as network_error', async () => {
      dao.generateLesson.mockRejectedValue(new FunctionsFetchError(new Error('offline')));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'network_error' });
    });

    // The Supabase relay itself failing to reach the function is also a transport-level failure.
    it('normalizes a FunctionsRelayError as network_error', async () => {
      dao.generateLesson.mockRejectedValue(new FunctionsRelayError({ region: 'us-east-1' }));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'network_error' });
    });

    // An error that is none of the three known DAO-thrown shapes still falls through to the
    // generic generation_failed code, distinct from network_error.
    it('normalizes an unrecognized error type as generation_failed, not network_error', async () => {
      dao.generateLesson.mockRejectedValue(new Error('unexpected DAO failure'));

      await expect(
        LessonGenerationService.generate({ documentId: 'doc-1', composition: 'both' }, 'user-1'),
      ).rejects.toMatchObject({ code: 'generation_failed' });
    });
  });
});
