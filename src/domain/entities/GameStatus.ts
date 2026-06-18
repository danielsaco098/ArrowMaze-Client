/** Lifecycle status of a single level play. */
export enum GameStatus {
  Playing = 'PLAYING',
  Victory = 'VICTORY',
  Defeat = 'DEFEAT',
}

/** What happened on a single tap. */
export enum TapOutcome {
  Escaped = 'ESCAPED',
  Blocked = 'BLOCKED',
}

/** Immutable result returned by {@link GameSession.tap}. */
export interface TapResult {
  readonly outcome: TapOutcome;
  readonly status: GameStatus;
  readonly livesRemaining: number;
  readonly arrowsRemaining: number;
}
