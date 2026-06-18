import { GameEvent, GameEventType } from './GameEvent';
import type { TapOutcome } from '../entities/GameStatus';

/** Emitted after every tap, whether the arrow escaped or was blocked. */
export class PlayerMovedEvent extends GameEvent {
  readonly type: GameEventType = 'PLAYER_MOVED';

  constructor(
    public readonly outcome: TapOutcome,
    public readonly livesRemaining: number,
    public readonly arrowsRemaining: number,
  ) {
    super();
  }
}
