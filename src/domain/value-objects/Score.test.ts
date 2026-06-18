import { Score } from './Score';
import { InvalidScoreError } from '../errors';

describe('Score', () => {
  it('should_be_zero_when_created_as_zero', () => {
    expect(Score.zero().points).toBe(0);
  });

  it('should_round_points_to_nearest_integer_when_created', () => {
    expect(Score.of(120.6).points).toBe(121);
  });

  it('should_throw_InvalidScoreError_when_points_are_negative_or_not_finite', () => {
    expect(() => Score.of(-5)).toThrow(InvalidScoreError);
    expect(() => Score.of(Number.NaN)).toThrow(InvalidScoreError);
  });

  it('should_compare_two_scores_when_using_isGreaterThan', () => {
    expect(Score.of(200).isGreaterThan(Score.of(100))).toBe(true);
    expect(Score.of(100).isGreaterThan(Score.of(200))).toBe(false);
  });
});
