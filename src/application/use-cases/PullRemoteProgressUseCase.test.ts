import { PullRemoteProgressUseCase } from './PullRemoteProgressUseCase';
import { NotAuthenticatedError } from '../errors';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { Score } from '../../domain/value-objects/Score';
import type { IProgressApi } from '../ports/IProgressApi';
import type { IProgressRepository } from '../ports/IProgressRepository';
import type { ISessionSource } from '../ports/ISessionSource';

const apiWith = (records: Array<{ levelId: number; bestScore: number }>): jest.Mocked<IProgressApi> => ({
  sync: jest.fn(),
  getProgress: jest.fn().mockResolvedValue(records),
});

const repoWith = (initial: PlayerProgress): jest.Mocked<IProgressRepository> => ({
  load: jest.fn().mockResolvedValue(initial),
  save: jest.fn().mockResolvedValue(undefined),
});

const sessionWith = (token: string | null): ISessionSource => ({
  getToken: jest.fn().mockResolvedValue(token),
  getUserId: jest.fn().mockResolvedValue(token === null ? null : 'user-1'),
});

describe('PullRemoteProgressUseCase', () => {
  it('should_merge_the_remote_records_into_the_local_store_when_signed_in', async () => {
    // Arrange: the account beat levels 1-2 on the backend; locally only 1 (lower score)
    const api = apiWith([
      { levelId: 1, bestScore: 900 },
      { levelId: 2, bestScore: 750 },
    ]);
    const repo = repoWith(PlayerProgress.empty().recordCompletion(1, Score.of(400)));
    const useCase = new PullRemoteProgressUseCase(api, repo, sessionWith('jwt'));

    // Act
    const merged = await useCase.execute();

    // Assert: best score wins per level and the merge is persisted
    expect(merged.bestScore(1)).toBe(900);
    expect(merged.bestScore(2)).toBe(750);
    expect(merged.isUnlocked(3)).toBe(true);
    expect(repo.save).toHaveBeenCalledWith(merged);
    expect(api.getProgress).toHaveBeenCalledWith('jwt');
  });

  it('should_keep_the_higher_local_score_when_the_remote_one_is_lower', async () => {
    // Arrange
    const api = apiWith([{ levelId: 1, bestScore: 300 }]);
    const repo = repoWith(PlayerProgress.empty().recordCompletion(1, Score.of(950)));
    const useCase = new PullRemoteProgressUseCase(api, repo, sessionWith('jwt'));

    // Act
    const merged = await useCase.execute();

    // Assert
    expect(merged.bestScore(1)).toBe(950);
  });

  it('should_throw_NotAuthenticatedError_when_no_session_is_active', async () => {
    // Arrange
    const api = apiWith([]);
    const repo = repoWith(PlayerProgress.empty());
    const useCase = new PullRemoteProgressUseCase(api, repo, sessionWith(null));

    // Act / Assert
    await expect(useCase.execute()).rejects.toThrow(NotAuthenticatedError);
    expect(api.getProgress).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
