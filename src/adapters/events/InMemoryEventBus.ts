import type { IEventPublisher } from '../../application/ports/IEventPublisher';
import type { IObserver } from '../../application/ports/IObserver';
import type { GameEvent } from '../../domain/events/GameEvent';

/**
 * In-memory implementation of the Observer pattern.
 *
 * Plays the Subject role: observers subscribe and are notified of every
 * published {@link GameEvent}. As an {@link IEventPublisher} it is what use cases
 * publish to; as a subject it fans events out to UI / scoring / audio observers,
 * keeping publishers and subscribers fully decoupled.
 */
export class InMemoryEventBus implements IEventPublisher {
  private readonly observers = new Set<IObserver>();

  /** Registers an observer and returns a function that unsubscribes it. */
  subscribe(observer: IObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  unsubscribe(observer: IObserver): void {
    this.observers.delete(observer);
  }

  publish(event: GameEvent): void {
    // Iterate over a snapshot so an observer that unsubscribes while handling
    // an event cannot disturb the in-progress notification loop.
    for (const observer of [...this.observers]) {
      observer.notify(event);
    }
  }
}
