import type { UseCase } from '../ports/UseCase';
import type { ILeaderboardApi, OverallLeaderboardEntry } from '../ports/ILeaderboardApi';

export interface GetOverallLeaderboardInput {
  readonly limit?: number;
}

/**
 * Fetches the overall ranking (each player's best scores summed across all
 * levels). Auth-required by product rule: the Composition Root wraps it with
 * the authentication aspect, which verifies the active session before this
 * code runs.
 */
export class GetOverallLeaderboardUseCase
  implements UseCase<GetOverallLeaderboardInput, OverallLeaderboardEntry[]>
{
  constructor(private readonly leaderboardApi: ILeaderboardApi) {}

  async execute(input: GetOverallLeaderboardInput): Promise<OverallLeaderboardEntry[]> {
    return this.leaderboardApi.topOverall(input.limit);
  }
}
