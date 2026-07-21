import type { InstructionalSlide, Slide } from '@helsoft/types';

export const isInstructional = (slide: Slide): slide is InstructionalSlide =>
  slide.kind === 'instructional';
