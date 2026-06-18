import type { IObserver } from '../../application/ports/IObserver';
import type { IAudioService } from '../../application/ports/IAudioService';
import type { GameEvent } from '../../domain/events/GameEvent';
import { PlayerMovedEvent } from '../../domain/events/PlayerMovedEvent';
import { LevelCompletedEvent } from '../../domain/events/LevelCompletedEvent';
import { GameOverEvent } from '../../domain/events/GameOverEvent';
import { TapOutcome } from '../../domain/entities/GameStatus';

/**
 * Observer that turns game events into sound effects (Observer pattern).
 * Subscribed to the event bus, it reacts to gameplay without the use cases or
 * the UI knowing audio exists, depending only on the {@link IAudioService} port.
 */
export class AudioObserver implements IObserver {
  constructor(private readonly audio: IAudioService) {}

  notify(event: GameEvent): void {
    if (event instanceof PlayerMovedEvent) {
      this.audio.playEffect(event.outcome === TapOutcome.Escaped ? 'ESCAPE' : 'BLOCKED');
    } else if (event instanceof LevelCompletedEvent) {
      this.audio.playEffect('VICTORY');
    } else if (event instanceof GameOverEvent) {
      this.audio.playEffect('DEFEAT');
    }
  }
}
