import { TapCellUseCase } from './TapCellUseCase';
import type { IEventPublisher } from '../ports/IEventPublisher';
import type { GameEvent } from '../../domain/events/GameEvent';
import { PlayerMovedEvent } from '../../domain/events/PlayerMovedEvent';
import { LevelCompletedEvent } from '../../domain/events/LevelCompletedEvent';
import { GameOverEvent } from '../../domain/events/GameOverEvent';
import { GameSession } from '../../domain/entities/GameSession';
import { PathTraversalService } from '../../domain/services/PathTraversalService';
import { Lives } from '../../domain/value-objects/Lives';
import { Position } from '../../domain/value-objects/Position';
import { TapOutcome } from '../../domain/entities/GameStatus';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';

/** Test double that records every published event. */
class RecordingPublisher implements IEventPublisher {
  readonly events: GameEvent[] = [];
  publish(event: GameEvent): void {
    this.events.push(event);
  }
}

describe('TapCellUseCase', () => {
  it('should_return_the_session_result_and_publish_player_moved_when_an_arrow_escapes', async () => {
    // Arrange
    const session = new GameSession(
      buildBoard([
        [arrow('RIGHT'), empty(), empty()],
        [arrow('RIGHT'), empty(), empty()],
      ]),
    );
    const publisher = new RecordingPublisher();
    const useCase = new TapCellUseCase(publisher);

    // Act
    const result = await useCase.execute({ session, position: new Position(0, 0) });

    // Assert
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toBeInstanceOf(PlayerMovedEvent);
  });

  it('should_publish_level_completed_when_the_last_arrow_escapes', async () => {
    // Arrange
    const session = new GameSession(buildBoard([[arrow('RIGHT'), empty()]]));
    const publisher = new RecordingPublisher();
    const useCase = new TapCellUseCase(publisher);

    // Act
    await useCase.execute({ session, position: new Position(0, 0) });

    // Assert
    expect(publisher.events.map((e) => e.type)).toEqual(['PLAYER_MOVED', 'LEVEL_COMPLETED']);
    expect(publisher.events[1]).toBeInstanceOf(LevelCompletedEvent);
  });

  it('should_publish_game_over_when_the_blocked_tap_drains_the_last_life', async () => {
    // Arrange: arrows block each other, only one life left
    const session = new GameSession(
      buildBoard([[arrow('DOWN')], [arrow('UP')]]),
      new PathTraversalService(),
      Lives.of(1),
    );
    const publisher = new RecordingPublisher();
    const useCase = new TapCellUseCase(publisher);

    // Act
    await useCase.execute({ session, position: new Position(1, 0) });

    // Assert
    expect(publisher.events.map((e) => e.type)).toEqual(['PLAYER_MOVED', 'GAME_OVER']);
    expect(publisher.events[1]).toBeInstanceOf(GameOverEvent);
  });

  it('should_not_publish_terminal_events_while_the_game_continues', async () => {
    // Arrange: two arrows, first escapes but one remains
    const session = new GameSession(
      buildBoard([
        [arrow('RIGHT'), empty(), empty()],
        [arrow('RIGHT'), empty(), empty()],
      ]),
    );
    const publisher = new RecordingPublisher();
    const useCase = new TapCellUseCase(publisher);

    // Act
    await useCase.execute({ session, position: new Position(0, 0) });

    // Assert
    expect(publisher.events.map((e) => e.type)).toEqual(['PLAYER_MOVED']);
  });
});
