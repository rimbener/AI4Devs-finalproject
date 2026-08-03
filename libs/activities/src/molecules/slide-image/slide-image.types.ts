import type { SlideImageRef } from '@helsoft/types';

export type SlideImageProps = {
  image?: SlideImageRef;
  /** Selects width-bounded stacked or height-bounded split sizing. */
  layout?: 'stacked' | 'split';
};

export type PaneSize = {
  width: number;
  height: number;
};
