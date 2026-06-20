export interface LeaderboardEntry {
  levelId: number;
  username: string;
  score: number;
  achievedAt: string;
}

/** Port for the backend leaderboard endpoint. */
export interface ILeaderboardApi {
  topForLevel(levelId: number, limit?: number): Promise<LeaderboardEntry[]>;
}
