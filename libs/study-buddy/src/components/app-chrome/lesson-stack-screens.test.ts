import { LESSON_STACK_SCREENS } from './lesson-stack-screens';

// Pure factory for the pushed lesson routes' header config (@s8).
describe('LESSON_STACK_SCREENS', () => {
  it('exposes exactly the three lesson routes in order, mapped to their nav title keys (@s8)', () => {
    expect(LESSON_STACK_SCREENS).toEqual([
      { name: 'lesson/[id]/index', titleKey: 'nav.lesson' },
      { name: 'lesson/[id]/player', titleKey: 'nav.study' },
      { name: 'lesson/[id]/results', titleKey: 'nav.results' },
    ]);
  });
});
