import { LocalProgressRepository } from './LocalProgressRepository';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { Score } from '../../domain/value-objects/Score';
import { InMemoryKeyValueStorage } from '../../test-support/InMemoryKeyValueStorage';
import type { ISessionSource } from '../../application/ports/ISessionSource';

const STORAGE_KEY = 'arrowmaze.progress.v1';

const sessionOf = (userId: string | null): ISessionSource => ({
  getToken: jest.fn().mockResolvedValue(userId === null ? null : 'jwt'),
  getUserId: jest.fn().mockResolvedValue(userId),
});

describe('LocalProgressRepository', () => {
  it('should_return_empty_progress_when_nothing_is_stored', async () => {
    // Arrange
    const repo = new LocalProgressRepository(new InMemoryKeyValueStorage());

    // Act
    const progress = await repo.load();

    // Assert
    expect(progress.completedCount()).toBe(0);
  });

  it('should_reload_the_same_progress_when_it_was_persisted', async () => {
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

  it('should_keep_each_users_progress_separate_when_different_users_play_on_the_device', async () => {
    // Arrange: ana beats level 1 while signed in on this device
    const storage = new InMemoryKeyValueStorage();
    const anaRepo = new LocalProgressRepository(storage, sessionOf('ana-id'));
    await anaRepo.save(PlayerProgress.empty().recordCompletion(1, Score.of(900)));

    // Act: bob signs in on the same device
    const bobRepo = new LocalProgressRepository(storage, sessionOf('bob-id'));
    const bobProgress = await bobRepo.load();

    // Assert: bob starts from scratch; ana's unlocks are not his
    expect(bobProgress.completedCount()).toBe(0);
    expect(bobProgress.isUnlocked(2)).toBe(false);
    expect((await anaRepo.load()).bestScore(1)).toBe(900);
  });

  it('should_not_share_guest_progress_with_a_signed_in_user', async () => {
    // Arrange: a guest beats level 1
    const storage = new InMemoryKeyValueStorage();
    const guestRepo = new LocalProgressRepository(storage, sessionOf(null));
    await guestRepo.save(PlayerProgress.empty().recordCompletion(1, Score.of(700)));

    // Act
    const userRepo = new LocalProgressRepository(storage, sessionOf('ana-id'));

    // Assert
    expect((await userRepo.load()).completedCount()).toBe(0);
    expect((await guestRepo.load()).bestScore(1)).toBe(700);
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
