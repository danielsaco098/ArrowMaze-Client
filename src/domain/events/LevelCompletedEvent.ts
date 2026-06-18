import { GameEvent, GameEventType } from './GameEvent';

/** Emitted when the last arrow leaves the board and the level is won. */
export class LevelCompletedEvent extends GameEvent {
  readonly type: GameEventType = 'LEVEL_COMPLETED';

  constructor(public readonly moves: number) {
    super();
  }
}
