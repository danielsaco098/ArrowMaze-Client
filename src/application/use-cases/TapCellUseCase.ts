import type { UseCase } from '../ports/UseCase';
import type { IEventPublisher } from '../ports/IEventPublisher';
import type { GameSession } from '../../domain/entities/GameSession';
import type { Position } from '../../domain/value-objects/Position';
import { GameStatus, TapResult } from '../../domain/entities/GameStatus';
import { PlayerMovedEvent } from '../../domain/events/PlayerMovedEvent';
import { LevelCompletedEvent } from '../../domain/events/LevelCompletedEvent';
import { GameOverEvent } from '../../domain/events/GameOverEvent';

export interface TapCellInput {
  readonly session: GameSession;
  readonly position: Position;
}

/**
 * Applies a player tap to the running session and announces what happened.
 *
 * The use case only orchestrates: the rule itself lives in {@link GameSession},
 * and notifying listeners goes through the {@link IEventPublisher} port, so this
 * class depends on abstractions only (Dependency Inversion, Single Responsibility).
 */
export class TapCellUseCase implements UseCase<TapCellInput, TapResult> {
  constructor(private readonly events: IEventPublisher) {}

  async execute({ session, position }: TapCellInput): Promise<TapResult> {
    const result = session.tap(position);

    this.events.publish(
      new PlayerMovedEvent(result.outcome, result.livesRemaining, result.arrowsRemaining),
    );

    if (result.status === GameStatus.Victory) {
      this.events.publish(new LevelCompletedEvent(session.moves));
    } else if (result.status === GameStatus.Defeat) {
      this.events.publish(new GameOverEvent(session.moves));
    }

    return result;
  }
}
