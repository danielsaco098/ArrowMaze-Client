import type { GameEvent } from '../../domain/events/GameEvent';

/**
 * Port for publishing domain events to interested observers (Observer pattern).
 * Use cases depend on this abstraction; the concrete event bus lives in Layer 3.
 */
export interface IEventPublisher {
  publish(event: GameEvent): void;
}
