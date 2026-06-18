import type { Score } from '../value-objects/Score';

/**
 * Immutable aggregate of the player's progress: the best score achieved on each
 * completed level. A level counts as completed once it has a best score.
 *
 * All mutations return a new instance, which keeps the object easy to test and
 * safe to share across the UI.
 */
export class PlayerProgress {
  private constructor(private readonly bestScores: ReadonlyMap<number, number>) {}

  static empty(): PlayerProgress {
    return new PlayerProgress(new Map());
  }

  static fromEntries(entries: ReadonlyArray<readonly [number, number]>): PlayerProgress {
    return new PlayerProgress(new Map(entries));
  }

  isCompleted(levelId: number): boolean {
    return this.bestScores.has(levelId);
  }

  bestScore(levelId: number): number | undefined {
    return this.bestScores.get(levelId);
  }

  completedLevelIds(): number[] {
    return [...this.bestScores.keys()].sort((a, b) => a - b);
  }

  completedCount(): number {
    return this.bestScores.size;
  }

  /** Level 1 is always playable; any later level unlocks once the previous one is completed. */
  isUnlocked(levelId: number): boolean {
    return levelId <= 1 || this.isCompleted(levelId - 1);
  }

  /** Records a completion, keeping only the higher of the new and existing score. */
  recordCompletion(levelId: number, score: Score): PlayerProgress {
    const previous = this.bestScores.get(levelId);
    if (previous !== undefined && previous >= score.points) {
      return this;
    }
    const next = new Map(this.bestScores);
    next.set(levelId, score.points);
    return new PlayerProgress(next);
  }

  entries(): Array<[number, number]> {
    return [...this.bestScores.entries()];
  }
}
