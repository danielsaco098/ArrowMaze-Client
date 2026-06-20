import type { IHttpClient } from '../../application/ports/IHttpClient';
import type { ILeaderboardApi, LeaderboardEntry } from '../../application/ports/ILeaderboardApi';

/** Talks to the backend `GET /leaderboard/:levelId` endpoint. */
export class RestLeaderboardApi implements ILeaderboardApi {
  constructor(private readonly http: IHttpClient) {}

  topForLevel(levelId: number, limit = 10): Promise<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/leaderboard/${levelId}`, { query: { limit } });
  }
}
