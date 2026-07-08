import type { UseCase } from '../ports/UseCase';
import type { IProgressRepository } from '../ports/IProgressRepository';
import type { IScoringStrategy } from '../../domain/services/ScoringStrategy';
import type { Difficulty } from '../../domain/entities/Level';
import type { PlayerProgress } from '../../domain/entities/PlayerProgress';
import type { Score } from '../../domain/value-objects/Score';

export interface RecordLevelResultInput {
  readonly levelId: number;
  readonly moves: number;
  readonly elapsedMs: number;
  readonly difficulty: Difficulty;
  /** Stars collected during the level (bonus points); defaults to 0. */
  readonly collectibles?: number;
}

export interface RecordLevelResultOutput {
  readonly score: Score;
  readonly progress: PlayerProgress;
  readonly isNewBest: boolean;
}

/**
 * Records a completed level: computes its score via the scoring strategy, merges
 * it into the persisted progress (keeping the best), and saves it. Depends only
 * on the {@link IScoringStrategy} and {@link IProgressRepository} abstractions.
 */
export class RecordLevelResultUseCase
  implements UseCase<RecordLevelResultInput, RecordLevelResultOutput>
{
  constructor(
    private readonly scoring: IScoringStrategy,
    private readonly progressRepository: IProgressRepository,
  ) {}

  async execute(input: RecordLevelResultInput): Promise<RecordLevelResultOutput> {
    const score = this.scoring.score({
      moves: input.moves,
      elapsedMs: input.elapsedMs,
      difficulty: input.difficulty,
      collectibles: input.collectibles,
    });

    const current = await this.progressRepository.load();
    const previousBest = current.bestScore(input.levelId);
    const updated = current.recordCompletion(input.levelId, score);
    await this.progressRepository.save(updated);

    const isNewBest = previousBest === undefined || score.points > previousBest;
    return { score, progress: updated, isNewBest };
  }
}
