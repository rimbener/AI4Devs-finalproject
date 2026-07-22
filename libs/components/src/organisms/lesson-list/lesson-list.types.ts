export type LessonListState = 'loading' | 'content' | 'empty' | 'error';

export type LessonListItemData = {
  id: string;
  title: string;
  createdDateLabel: string;
  openAccessibilityLabel: string;
  /** Per-item delete control name (@s16); falls back to list-level `deleteLabel`. */
  deleteAccessibilityLabel?: string;
};

export type LessonListSharedProps = {
  state: LessonListState;
  lessons: LessonListItemData[];
  onOpenLesson: (id: string) => void;
  onRetry: () => void;
  deleteLabel?: string;
};

export type LessonListProps =
  | (LessonListSharedProps & {
      onDelete?: undefined;
    })
  | (LessonListSharedProps & {
      onDelete: (id: string) => void;
    });
