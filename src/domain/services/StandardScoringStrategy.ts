import { Score } from '../value-objects/Score';
import type { Difficulty } from '../entities/Level';
import type { IScoringStrategy, ScoreInput } from './ScoringStrategy';

export interface StandardScoringConfig {
  readonly baseByDifficulty: Record<Difficulty, number>;
  readonly movePenalty: number;
  readonly timePenaltyPerSecond: number;
  readonly collectibleBonus: number;
  readonly minimumScore: number;
}

const DEFAULT_CONFIG: StandardScoringConfig = {
  baseByDifficulty: { EASY: 1000, MEDIUM: 2000, HARD: 3000 },
  movePenalty: 10,
  timePenaltyPerSecond: 5,
  collectibleBonus: 50,
  minimumScore: 100,
};

/**
 * Default scoring: start from a difficulty-based budget, subtract penalties for
 * the number of moves used and the seconds elapsed, and add a bonus per star
 * collected, never dropping below a floor. The weights are injectable, so the
 * same algorithm can be re-tuned (OCP) or replaced entirely with another
 * {@link IScoringStrategy}.
 */
export class StandardScoringStrategy implements IScoringStrategy {
  private readonly config: StandardScoringConfig;

  constructor(config: Partial<StandardScoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  score({ moves, elapsedMs, difficulty, collectibles = 0 }: ScoreInput): Score {
    const base = this.config.baseByDifficulty[difficulty];
    const seconds = Math.floor(Math.max(0, elapsedMs) / 1000);
    const movesUsed = Math.max(0, moves);

    const raw =
      base -
      movesUsed * this.config.movePenalty -
      seconds * this.config.timePenaltyPerSecond +
      Math.max(0, collectibles) * this.config.collectibleBonus;

    return Score.of(Math.max(this.config.minimumScore, raw));
  }
}
