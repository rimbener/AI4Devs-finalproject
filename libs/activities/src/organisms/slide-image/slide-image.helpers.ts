export type PaneSize = {
  width: number;
  height: number;
};

/** Fit image inside a pane while preserving aspect ratio (never upscale past pane). */
export const getContainedImageSize = (aspectRatio: number, pane: PaneSize): PaneSize => {
  const width = Math.min(pane.width, pane.height * aspectRatio);
  return { width, height: width / aspectRatio };
};
