import type { MultipleChoiceAnswer, MultipleChoiceSlide } from '@helsoft/types';

export type MultipleChoiceProps = {
  slide: MultipleChoiceSlide;
  onAnswered?: (answer: MultipleChoiceAnswer) => void;
  /** Pre-graded answer (Storybook demos / resume). */
  initialAnswer?: MultipleChoiceAnswer | null;
};

export type UseMultipleChoiceProps = {
  slide: MultipleChoiceSlide;
  initialAnswer?: MultipleChoiceAnswer | null;
};
