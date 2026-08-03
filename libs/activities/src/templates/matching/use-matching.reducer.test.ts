import type { MatchingAnswer } from '@helsoft/types';

import {
  createMatchingInitialState,
  type MatchingState,
  matchingReducer,
} from './use-matching.reducer';

const graded: MatchingAnswer = {
  slideId: 's1',
  activityType: 'matching',
  pairs: [{ leftId: 'l1', rightId: 'r1', isCorrect: true }],
  correctPairCount: 1,
  totalPairCount: 1,
  isCorrect: true,
};

describe('matchingReducer', () => {
  it('starts with empty pending/pairs and optional seeds', () => {
    expect(createMatchingInitialState()).toEqual({
      pending: null,
      formedPairs: [],
      answer: null,
    });
    expect(createMatchingInitialState([{ leftId: 'l1', rightId: 'r1' }], graded)).toEqual({
      pending: null,
      formedPairs: [{ leftId: 'l1', rightId: 'r1' }],
      answer: graded,
    });
  });

  it('item/press sets pending when none selected', () => {
    const next = matchingReducer(createMatchingInitialState(), {
      type: 'item/press',
      column: 'left',
      id: 'l1',
    });
    expect(next.pending).toEqual({ column: 'left', id: 'l1' });
  });

  it('item/press clears pending when tapping the same item', () => {
    const pending: MatchingState = {
      ...createMatchingInitialState(),
      pending: { column: 'left', id: 'l1' },
    };
    const next = matchingReducer(pending, { type: 'item/press', column: 'left', id: 'l1' });
    expect(next.pending).toBeNull();
  });

  it('item/press reselects when tapping another item in the same column', () => {
    const pending: MatchingState = {
      ...createMatchingInitialState(),
      pending: { column: 'left', id: 'l1' },
    };
    const next = matchingReducer(pending, { type: 'item/press', column: 'left', id: 'l2' });
    expect(next.pending).toEqual({ column: 'left', id: 'l2' });
  });

  it('item/press forms a pair across columns and clears pending', () => {
    const pending: MatchingState = {
      ...createMatchingInitialState(),
      pending: { column: 'left', id: 'l1' },
    };
    const next = matchingReducer(pending, { type: 'item/press', column: 'right', id: 'r1' });
    expect(next.formedPairs).toEqual([{ leftId: 'l1', rightId: 'r1' }]);
    expect(next.pending).toBeNull();
  });

  it('item/press releases an existing pair and clears pending', () => {
    const paired: MatchingState = {
      ...createMatchingInitialState([{ leftId: 'l1', rightId: 'r1' }]),
      pending: { column: 'left', id: 'l2' },
    };
    const next = matchingReducer(paired, { type: 'item/press', column: 'left', id: 'l1' });
    expect(next.formedPairs).toEqual([]);
    expect(next.pending).toBeNull();
  });

  it('item/press is a no-op once answered', () => {
    const answered = createMatchingInitialState([], graded);
    const next = matchingReducer(answered, { type: 'item/press', column: 'left', id: 'l1' });
    expect(next).toBe(answered);
  });

  it('submit stores the answer and clears pending', () => {
    const pending: MatchingState = {
      ...createMatchingInitialState([{ leftId: 'l1', rightId: 'r1' }]),
      pending: { column: 'left', id: 'l2' },
    };
    const next = matchingReducer(pending, { type: 'submit', answer: graded });
    expect(next.answer).toEqual(graded);
    expect(next.pending).toBeNull();
    expect(next.formedPairs).toEqual([{ leftId: 'l1', rightId: 'r1' }]);
  });

  it('submit is a no-op when already answered', () => {
    const answered = createMatchingInitialState([], graded);
    const other: MatchingAnswer = { ...graded, isCorrect: false };
    const next = matchingReducer(answered, { type: 'submit', answer: other });
    expect(next).toBe(answered);
  });
});
