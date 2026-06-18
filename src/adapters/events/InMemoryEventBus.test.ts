import { InMemoryEventBus } from './InMemoryEventBus';
import type { IObserver } from '../../application/ports/IObserver';
import type { GameEvent } from '../../domain/events/GameEvent';
import { LevelCompletedEvent } from '../../domain/events/LevelCompletedEvent';

/** Test observer that records the events it receives. */
class RecordingObserver implements IObserver {
  readonly received: GameEvent[] = [];
  notify(event: GameEvent): void {
    this.received.push(event);
  }
}

describe('InMemoryEventBus', () => {
  it('should_notify_every_subscriber_when_an_event_is_published', () => {
    // Arrange
    const bus = new InMemoryEventBus();
    const a = new RecordingObserver();
    const b = new RecordingObserver();
    bus.subscribe(a);
    bus.subscribe(b);
    const event = new LevelCompletedEvent(5);

    // Act
    bus.publish(event);

    // Assert
    expect(a.received).toEqual([event]);
    expect(b.received).toEqual([event]);
  });

  it('should_stop_notifying_an_observer_after_it_unsubscribes', () => {
    // Arrange
    const bus = new InMemoryEventBus();
    const observer = new RecordingObserver();
    const unsubscribe = bus.subscribe(observer);

    // Act
    unsubscribe();
    bus.publish(new LevelCompletedEvent(1));

    // Assert
    expect(observer.received).toHaveLength(0);
  });

  it('should_not_throw_when_publishing_with_no_subscribers', () => {
    // Arrange
    const bus = new InMemoryEventBus();

    // Act / Assert
    expect(() => bus.publish(new LevelCompletedEvent(0))).not.toThrow();
  });

  it('should_only_register_a_subscriber_once_when_subscribed_twice', () => {
    // Arrange
    const bus = new InMemoryEventBus();
    const observer = new RecordingObserver();
    bus.subscribe(observer);
    bus.subscribe(observer);

    // Act
    bus.publish(new LevelCompletedEvent(2));

    // Assert: Set-backed registry de-duplicates, so only one notification
    expect(observer.received).toHaveLength(1);
  });
});
