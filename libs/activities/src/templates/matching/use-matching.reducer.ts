import type { MatchingAnswer } from '@helsoft/types';

import { findPairForItem } from './matching.helpers';
import type { MatchingPairSelection, PendingSelection } from './matching.types';

export type MatchingState = {
  pending: PendingSelection;
  formedPairs: MatchingPairSelection[];
  answer: MatchingAnswer | null;
};

export type MatchingAction =
  | { type: 'item/press'; column: 'left' | 'right'; id: string }
  | { type: 'submit'; answer: MatchingAnswer };

export const createMatchingInitialState = (
  initialPairs: MatchingPairSelection[] = [],
  initialAnswer: MatchingAnswer | null = null,
): MatchingState => ({
  pending: null,
  formedPairs: initialPairs,
  answer: initialAnswer,
});

/** Pure pairing + submit machine for Matching (pending / formedPairs / answer). */
export function matchingReducer(state: MatchingState, action: MatchingAction): MatchingState {
  switch (action.type) {
    case 'item/press': {
      if (state.answer) return state;

      const { column, id } = action;
      if (findPairForItem(state.formedPairs, id)) {
        return {
          ...state,
          formedPairs: state.formedPairs.filter(
            (pair) => pair.leftId !== id && pair.rightId !== id,
          ),
          pending: null,
        };
      }

      if (!state.pending) {
        return { ...state, pending: { column, id } };
      }

      if (state.pending.column === column && state.pending.id === id) {
        return { ...state, pending: null };
      }

      if (state.pending.column === column) {
        return { ...state, pending: { column, id } };
      }

      const leftId = column === 'left' ? id : state.pending.id;
      const rightId = column === 'right' ? id : state.pending.id;
      return {
        ...state,
        formedPairs: [...state.formedPairs, { leftId, rightId }],
        pending: null,
      };
    }
    case 'submit': {
      if (state.answer) return state;
      return { ...state, answer: action.answer, pending: null };
    }
  }
}
