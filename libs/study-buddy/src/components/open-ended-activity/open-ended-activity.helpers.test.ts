import { OPEN_ENDED_MAX_LENGTH } from './open-ended-activity.helpers';

describe('OPEN_ENDED_MAX_LENGTH', () => {
  it('is the short-answer ceiling (not derived from modelAnswer)', () => {
    expect(OPEN_ENDED_MAX_LENGTH).toBe(2000);
  });
});
