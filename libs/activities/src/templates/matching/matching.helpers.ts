import type { ItemVisualState, MatchingItemView, MatchingPairSelection } from './matching.types';

export const findPairForItem = (
  pairs: MatchingPairSelection[],
  itemId: string,
): MatchingPairSelection | undefined =>
  pairs.find((pair) => pair.leftId === itemId || pair.rightId === itemId);

export const itemAccessibilityLabel = (
  item: MatchingItemView,
  state: ItemVisualState,
  correctPairLabel: string,
  incorrectPairLabel: string,
): string => {
  if (state === 'correct') return `${item.label}, ${correctPairLabel}`;
  if (state === 'incorrect') return `${item.label}, ${incorrectPairLabel}`;
  return item.label;
};
