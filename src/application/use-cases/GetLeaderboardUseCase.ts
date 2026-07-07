import type { UseCase } from '../ports/UseCase';
import type { ILeaderboardApi, LeaderboardEntry } from '../ports/ILeaderboardApi';

export interface GetLeaderboardInput {
  readonly levelId: number;
  readonly limit?: number;
}

/**
 * Fetches the global leaderboard for a level. Auth-required by product rule:
 * the Composition Root wraps it with the authentication aspect, which verifies
 * the active session before this code runs — so the use case stays pure
 * orchestration.
 */
export class GetLeaderboardUseCase implements UseCase<GetLeaderboardInput, LeaderboardEntry[]> {
  constructor(private readonly leaderboardApi: ILeaderboardApi) {}

  async execute(input: GetLeaderboardInput): Promise<LeaderboardEntry[]> {
    return this.leaderboardApi.topForLevel(input.levelId, input.limit);
  }
}
