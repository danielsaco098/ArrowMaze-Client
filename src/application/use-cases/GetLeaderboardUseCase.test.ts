import { GetLeaderboardUseCase } from './GetLeaderboardUseCase';
import type { ILeaderboardApi } from '../ports/ILeaderboardApi';

describe('GetLeaderboardUseCase', () => {
  it('should_fetch_the_top_entries_when_given_a_level_id', async () => {
    // Arrange
    const entries = [{ levelId: 3, username: 'ana', score: 900, achievedAt: '2026-07-01' }];
    const api: jest.Mocked<ILeaderboardApi> = {
      topForLevel: jest.fn().mockResolvedValue(entries),
      topOverall: jest.fn(),
    };
    const useCase = new GetLeaderboardUseCase(api);

    // Act
    const result = await useCase.execute({ levelId: 3, limit: 10 });

    // Assert
    expect(api.topForLevel).toHaveBeenCalledWith(3, 10);
    expect(result).toEqual(entries);
  });
});
