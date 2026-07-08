import type { Score } from '../value-objects/Score';
import type { Difficulty } from '../entities/Level';

/** The data a finished level provides to compute its score. */
export interface ScoreInput {
  readonly moves: number;
  readonly elapsedMs: number;
  readonly difficulty: Difficulty;
  /** Stars collected during the level (bonus points); defaults to 0. */
  readonly collectibles?: number;
}

/**
 * Strategy for turning a level result into a {@link Score}. Different algorithms
 * (standard, speed-run, par-based…) can be swapped at runtime without touching
 * the code that records results — the Strategy pattern, as required by the brief.
 */
export interface IScoringStrategy {
  score(input: ScoreInput): Score;
}
