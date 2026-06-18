export type GameEventType = 'PLAYER_MOVED' | 'LEVEL_COMPLETED' | 'GAME_OVER';

/**
 * Base type for domain events. Events are immutable facts about something that
 * already happened in the game; the application layer publishes them so that
 * observers (UI, scoring, audio) can react without the domain knowing about them.
 */
export abstract class GameEvent {
  abstract readonly type: GameEventType;
}
