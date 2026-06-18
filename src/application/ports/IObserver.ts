import type { GameEvent } from '../../domain/events/GameEvent';

/**
 * An observer that reacts to game events (Observer pattern).
 * The UI, the scoring system and the audio service each implement this and
 * subscribe to the event bus; the publisher knows nothing about them.
 */
export interface IObserver {
  notify(event: GameEvent): void;
}
