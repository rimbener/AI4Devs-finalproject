export type LessonStackScreenConfig = {
  name: 'lesson/[id]/index' | 'lesson/[id]/player' | 'lesson/[id]/results';
  titleKey: 'nav.lesson' | 'nav.study' | 'nav.results';
};

/** Ordered header config for the three pushed lesson routes — keys only, the app resolves `t(titleKey)`. */
export const LESSON_STACK_SCREENS: readonly LessonStackScreenConfig[] = [
  { name: 'lesson/[id]/index', titleKey: 'nav.lesson' },
  { name: 'lesson/[id]/player', titleKey: 'nav.study' },
  { name: 'lesson/[id]/results', titleKey: 'nav.results' },
];
