import { GetOverallLeaderboardUseCase } from './GetOverallLeaderboardUseCase';
import type { ILeaderboardApi } from '../ports/ILeaderboardApi';

describe('GetOverallLeaderboardUseCase', () => {
  it('should_fetch_the_overall_ranking_when_executed', async () => {
    // Arrange
    const entries = [{ username: 'ana', totalScore: 4200, levelsPlayed: 5 }];
    const api: jest.Mocked<ILeaderboardApi> = {
      topForLevel: jest.fn(),
      topOverall: jest.fn().mockResolvedValue(entries),
    };
    const useCase = new GetOverallLeaderboardUseCase(api);

    // Act
    const result = await useCase.execute({ limit: 10 });

    // Assert
    expect(api.topOverall).toHaveBeenCalledWith(10);
    expect(result).toEqual(entries);
  });
});
