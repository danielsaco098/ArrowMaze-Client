import { InvalidLivesError, NoLivesRemainingError } from '../errors';

/**
 * Immutable value object for the player's remaining lives.
 * The player starts with {@link Lives.DEFAULT} (3) and loses one each time a
 * tapped arrow is blocked.
 */
export class Lives {
  static readonly DEFAULT = 3;

  private constructor(public readonly count: number) {}

  static of(count: number): Lives {
    if (!Number.isInteger(count) || count < 0) {
      throw new InvalidLivesError(count);
    }
    return new Lives(count);
  }

  static initial(): Lives {
    return Lives.of(Lives.DEFAULT);
  }

  /** Returns a new Lives with one fewer life. Throws if already at zero. */
  decrement(): Lives {
    if (this.isZero()) {
      throw new NoLivesRemainingError();
    }
    return new Lives(this.count - 1);
  }

  isZero(): boolean {
    return this.count === 0;
  }

  equals(other: Lives): boolean {
    return this.count === other.count;
  }
}
