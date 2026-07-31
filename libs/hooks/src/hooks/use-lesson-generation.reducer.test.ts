import type { GeneratedLesson } from '@helsoft/types';

import {
  useLessonGenerationInitialState,
  useLessonGenerationReducer,
} from './use-lesson-generation.reducer';

const generatedLesson: GeneratedLesson = {
  lessonId: 'lesson-1',
  title: 'French Geography',
  composition: 'both',
  slides: [],
};

describe('useLessonGenerationReducer', () => {
  it('starts generation, resetting to the first step and clearing result/error', () => {
    const priorState = {
      stage: 'error' as const,
      currentStep: 'attaching' as const,
      result: undefined,
      error: 'network_error' as const,
    };

    expect(useLessonGenerationReducer(priorState, { type: 'generate/start' })).toEqual({
      stage: 'generating',
      currentStep: 'reading',
      result: undefined,
      error: undefined,
    });
  });

  it('advances currentStep on generate/step, leaving the rest untouched', () => {
    const state = { ...useLessonGenerationInitialState, stage: 'generating' as const };

    expect(useLessonGenerationReducer(state, { type: 'generate/step', step: 'attaching' })).toEqual(
      { ...state, currentStep: 'attaching' },
    );
  });

  it('moves to content stage with the result on generate/success', () => {
    const state = {
      ...useLessonGenerationInitialState,
      stage: 'generating' as const,
      currentStep: 'attaching' as const,
    };

    expect(
      useLessonGenerationReducer(state, { type: 'generate/success', result: generatedLesson }),
    ).toEqual({ ...state, stage: 'content', result: generatedLesson });
  });

  it('moves to error stage with the error code on generate/failure', () => {
    const state = {
      ...useLessonGenerationInitialState,
      stage: 'generating' as const,
      currentStep: 'generating' as const,
    };

    expect(
      useLessonGenerationReducer(state, { type: 'generate/failure', error: 'timeout' }),
    ).toEqual({ ...state, stage: 'error', error: 'timeout' });
  });
});
