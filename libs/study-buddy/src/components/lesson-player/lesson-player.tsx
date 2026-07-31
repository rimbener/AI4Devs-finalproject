import { LessonPlayer as LessonPlayerOrganism, type LessonPlayerProps } from '@helsoft/activities';

/** Thin feature wiring — organism owns the deck. */
export const LessonPlayer = (props: LessonPlayerProps) => <LessonPlayerOrganism {...props} />;
