export interface LevelResult {
  levelId: number;
  score: number;
}

export interface RemoteProgressRecord {
  levelId: number;
  bestScore: number;
}

/** Port for the backend progress endpoints (JWT-protected). */
export interface IProgressApi {
  sync(token: string, results: LevelResult[]): Promise<RemoteProgressRecord[]>;
  getProgress(token: string): Promise<RemoteProgressRecord[]>;
}
