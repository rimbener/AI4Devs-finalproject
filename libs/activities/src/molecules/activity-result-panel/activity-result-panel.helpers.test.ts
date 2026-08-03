import { SUBMIT_SLIDE_DISTANCE } from './activity-result-panel.helpers';

describe('SUBMIT_SLIDE_DISTANCE', () => {
  it('uses the md spacing token', () => {
    expect(SUBMIT_SLIDE_DISTANCE).toBe(24);
  });
});
