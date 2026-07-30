export type LessonGenerationProps = {
  /** The extracted PDF's documentId, lifted by `upload.tsx` from `PdfUpload`'s `onExtracted`
   * (ai-lesson-generation decision #9). Undefined until extraction succeeds — Generate stays
   * gated on it (@s16). */
  documentId?: string;
  /** Fired once when generation reaches Content/ready with a persisted lessonId
   * (pending-pdfs-generate decision #5 / @s9). Additive/optional — omit = no-op. */
  onGenerated?: () => void;
  /** Fired right before navigating to the player (same lessonId guard as the navigation itself)
   * so a caller hosting this in a modal (e.g. `NewLessonDialog`) can dismiss it — otherwise the
   * modal stays open on top of the pushed player screen. Additive/optional — omit = no-op. */
  onOpenInPlayer?: () => void;
};
