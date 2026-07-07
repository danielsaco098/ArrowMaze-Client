export interface LeaderboardEntry {
  levelId: number;
  username: string;
  score: number;
  achievedAt: string;
}

/** A player's accumulated best scores across all levels. */
export interface OverallLeaderboardEntry {
  username: string;
  totalScore: number;
  levelsPlayed: number;
}

/** Port for the backend leaderboard endpoints. */
export interface ILeaderboardApi {
  topForLevel(levelId: number, limit?: number): Promise<LeaderboardEntry[]>;
  topOverall(limit?: number): Promise<OverallLeaderboardEntry[]>;
}
