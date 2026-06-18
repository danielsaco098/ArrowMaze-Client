import { GameEvent, GameEventType } from './GameEvent';

/** Emitted when the player runs out of lives and loses the level. */
export class GameOverEvent extends GameEvent {
  readonly type: GameEventType = 'GAME_OVER';

  constructor(public readonly moves: number) {
    super();
  }
}
