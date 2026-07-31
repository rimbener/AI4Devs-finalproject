import { calculateResultsPercent } from './results-summary.helpers';

describe('calculateResultsPercent', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateResultsPercent(0, 0)).toBe(0);
  });

  it('returns 0 when total is negative', () => {
    expect(calculateResultsPercent(0, -1)).toBe(0);
  });

  it('returns 100 when correct equals total', () => {
    expect(calculateResultsPercent(3, 3)).toBe(100);
  });

  it('returns 0 when nothing is correct', () => {
    expect(calculateResultsPercent(0, 5)).toBe(0);
  });

  it('rounds down when the fraction rounds to the nearest whole percent below', () => {
    expect(calculateResultsPercent(1, 3)).toBe(33);
  });

  it('rounds up when the fraction rounds to the nearest whole percent above', () => {
    expect(calculateResultsPercent(2, 3)).toBe(67);
  });
});
