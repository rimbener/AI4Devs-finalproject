import { LessonAttemptService } from '@helsoft/supabase-services';
import type { NewLessonAttempt } from '@helsoft/types';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { LessonAttemptStatus, UseLessonAttemptResult } from './use-lesson-attempt.types';

const mapStatus = (status: 'idle' | 'pending' | 'success' | 'error'): LessonAttemptStatus => {
  if (status === 'pending') return 'saving';
  if (status === 'success') return 'saved';
  return status;
};

/**
 * React integration over LessonAttemptService.saveAttempt via a save `useMutation`. Drives the
 * results-summary Loading/Content/Error states through `{ status, attempt, saveAttempt, retry }`.
 */
export const useLessonAttempt = (): UseLessonAttemptResult => {
  // Pure entry gate for BOTH saveAttempt and retry, cleared in onSettled below. `status`/
  // `attempt` always come from the mutation itself — this ref does nothing but gate entry.
  //
  // It cannot be replaced by `mutation.isPending`: that flag is React state and only becomes
  // `true` after a re-render, and TanStack does not dedupe `mutate()` calls — a second `mutate()`
  // issued in the same tick (e.g. a double-tap, or a handler firing alongside an effect) still
  // reads `isPending === false` and starts a second insert, producing a duplicate
  // `lesson_attempts` row (risk R4/R5). The ref closes that window synchronously, before either
  // call site can trigger a render. Do not remove it as "redundant" with `isPending`.
  const isSaving = useRef(false);

  const mutation = useMutation({
    mutationFn: (input: NewLessonAttempt) => LessonAttemptService.saveAttempt(input),
    onSettled: () => {
      isSaving.current = false;
    },
  });

  const { mutate, variables } = mutation;

  const saveAttempt = useCallback(
    (input: NewLessonAttempt) => {
      if (isSaving.current) return;
      isSaving.current = true;
      mutate(input);
    },
    [mutate],
  );

  const retry = useCallback(() => {
    if (isSaving.current) return;
    if (variables === undefined) return;
    isSaving.current = true;
    mutate(variables);
  }, [mutate, variables]);

  return {
    status: mapStatus(mutation.status),
    attempt: mutation.data ?? null,
    saveAttempt,
    retry,
  };
};
