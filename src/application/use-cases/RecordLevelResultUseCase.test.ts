import { RecordLevelResultUseCase } from './RecordLevelResultUseCase';
import { GetProgressUseCase } from './GetProgressUseCase';
import { StandardScoringStrategy } from '../../domain/services/StandardScoringStrategy';
import { LocalProgressRepository } from '../../adapters/repositories/LocalProgressRepository';
import { InMemoryKeyValueStorage } from '../../test-support/InMemoryKeyValueStorage';

function buildSubject() {
  const repository = new LocalProgressRepository(new InMemoryKeyValueStorage());
  const useCase = new RecordLevelResultUseCase(new StandardScoringStrategy(), repository);
  return { repository, useCase };
}

describe('RecordLevelResultUseCase', () => {
  it('should_compute_and_persist_the_score_when_a_level_is_completed', async () => {
    // Arrange
    const { repository, useCase } = buildSubject();

    // Act
    const result = await useCase.execute({
      levelId: 1,
      moves: 5,
      elapsedMs: 12_000,
      difficulty: 'EASY',
    });

    // Assert: score persisted and reloadable
    expect(result.score.points).toBe(890);
    expect(result.isNewBest).toBe(true);
    const reloaded = await repository.load();
    expect(reloaded.bestScore(1)).toBe(890);
  });

  it('should_report_a_new_best_only_when_the_score_improves', async () => {
    // Arrange
    const { useCase } = buildSubject();
    await useCase.execute({ levelId: 1, moves: 5, elapsedMs: 12_000, difficulty: 'EASY' }); // 890

    // Act: a worse run (more moves) then a better run (fewer moves)
    const worse = await useCase.execute({ levelId: 1, moves: 20, elapsedMs: 12_000, difficulty: 'EASY' });
    const better = await useCase.execute({ levelId: 1, moves: 1, elapsedMs: 0, difficulty: 'EASY' });

    // Assert
    expect(worse.isNewBest).toBe(false);
    expect(worse.progress.bestScore(1)).toBe(890); // unchanged
    expect(better.isNewBest).toBe(true);
    expect(better.progress.bestScore(1)).toBe(990);
  });
});

describe('GetProgressUseCase', () => {
  it('should_return_the_progress_when_it_was_persisted', async () => {
    // Arrange
    const repository = new LocalProgressRepository(new InMemoryKeyValueStorage());
    const record = new RecordLevelResultUseCase(new StandardScoringStrategy(), repository);
    await record.execute({ levelId: 1, moves: 3, elapsedMs: 5_000, difficulty: 'EASY' });
    const getProgress = new GetProgressUseCase(repository);

    // Act
    const progress = await getProgress.execute();

    // Assert
    expect(progress.isCompleted(1)).toBe(true);
    expect(progress.isUnlocked(2)).toBe(true);
  });
});
