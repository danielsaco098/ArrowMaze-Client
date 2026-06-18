import { LocalProgressRepository } from './LocalProgressRepository';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { Score } from '../../domain/value-objects/Score';
import { InMemoryKeyValueStorage } from '../../test-support/InMemoryKeyValueStorage';

const STORAGE_KEY = 'arrowmaze.progress.v1';

describe('LocalProgressRepository', () => {
  it('should_return_empty_progress_when_nothing_is_stored', async () => {
    // Arrange
    const repo = new LocalProgressRepository(new InMemoryKeyValueStorage());

    // Act
    const progress = await repo.load();

    // Assert
    expect(progress.completedCount()).toBe(0);
  });

  it('should_persist_and_reload_the_same_progress', async () => {
    // Arrange
    const repo = new LocalProgressRepository(new InMemoryKeyValueStorage());
    const progress = PlayerProgress.empty()
      .recordCompletion(1, Score.of(900))
      .recordCompletion(2, Score.of(750));

    // Act
    await repo.save(progress);
    const reloaded = await repo.load();

    // Assert
    expect(reloaded.completedLevelIds()).toEqual([1, 2]);
    expect(reloaded.bestScore(1)).toBe(900);
    expect(reloaded.bestScore(2)).toBe(750);
  });

  it('should_return_empty_progress_when_the_stored_payload_is_corrupt', async () => {
    // Arrange
    const storage = new InMemoryKeyValueStorage();
    storage.seed(STORAGE_KEY, 'not-valid-json{');
    const repo = new LocalProgressRepository(storage);

    // Act
    const progress = await repo.load();

    // Assert
    expect(progress.completedCount()).toBe(0);
  });
});
