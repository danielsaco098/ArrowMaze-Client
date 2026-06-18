import { InvalidScoreError } from '../errors';

/**
 * Immutable value object holding a non-negative integer score.
 *
 * The *strategy* for turning moves and elapsed time into points lives in a
 * dedicated scoring service (added later); this VO only guarantees the invariant
 * that a score is a valid, non-negative number.
 */
export class Score {
  private constructor(public readonly points: number) {}

  static of(points: number): Score {
    if (!Number.isFinite(points) || points < 0) {
      throw new InvalidScoreError(points);
    }
    return new Score(Math.round(points));
  }

  static zero(): Score {
    return new Score(0);
  }

  isGreaterThan(other: Score): boolean {
    return this.points > other.points;
  }

  equals(other: Score): boolean {
    return this.points === other.points;
  }
}
