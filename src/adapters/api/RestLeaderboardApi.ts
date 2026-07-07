import type { IHttpClient } from '../../application/ports/IHttpClient';
import type {
  ILeaderboardApi,
  LeaderboardEntry,
  OverallLeaderboardEntry,
} from '../../application/ports/ILeaderboardApi';

/** Talks to the backend `GET /leaderboard[/:levelId]` endpoints. */
export class RestLeaderboardApi implements ILeaderboardApi {
  constructor(private readonly http: IHttpClient) {}

  topForLevel(levelId: number, limit = 10): Promise<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/leaderboard/${levelId}`, { query: { limit } });
  }

  topOverall(limit = 10): Promise<OverallLeaderboardEntry[]> {
    return this.http.get<OverallLeaderboardEntry[]>('/leaderboard', { query: { limit } });
  }
}
