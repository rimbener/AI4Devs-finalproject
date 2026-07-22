import type { FillInTheBlankAnswer, FillInTheBlankSlide } from '@helsoft/types';

export type FillInTheBlankParts = { before: string; after: string };

export type FillInTheBlankProps = {
  slide: FillInTheBlankSlide;
  onAnswered?: (answer: FillInTheBlankAnswer) => void;
  /** Pre-graded answer (Storybook demos / resume). */
  initialAnswer?: FillInTheBlankAnswer | null;
};

export type UseFillInTheBlankProps = {
  slide: FillInTheBlankSlide;
  initialAnswer?: FillInTheBlankAnswer | null;
};
