import { LoggingUseCaseDecorator } from './LoggingUseCaseDecorator';
import { MetricsUseCaseDecorator } from './MetricsUseCaseDecorator';
import { ExceptionHandlingUseCaseDecorator } from './ExceptionHandlingUseCaseDecorator';
import { FakeClock, RecordingLogger, RecordingMetrics } from './testDoubles';
import { TapCellUseCase } from '../use-cases/TapCellUseCase';
import { InMemoryEventBus } from '../../adapters/events/InMemoryEventBus';
import { GameSession } from '../../domain/entities/GameSession';
import { Position } from '../../domain/value-objects/Position';
import { TapOutcome } from '../../domain/entities/GameStatus';
import type { UseCase } from '../ports/UseCase';
import type { TapCellInput } from '../use-cases/TapCellUseCase';
import type { TapResult } from '../../domain/entities/GameStatus';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';

describe('decorator composition over a real use case', () => {
  it('should_compose_transparently_when_aspects_are_stacked', async () => {
    // Arrange: wrap the real TapCellUseCase with all three cross-cutting aspects.
    const logger = new RecordingLogger();
    const metrics = new RecordingMetrics();
    const clock = new FakeClock();

    const base = new TapCellUseCase(new InMemoryEventBus());
    const decorated: UseCase<TapCellInput, TapResult> = new ExceptionHandlingUseCaseDecorator(
      new MetricsUseCaseDecorator(
        new LoggingUseCaseDecorator(base, 'TapCell', logger, clock),
        'TapCell',
        metrics,
        clock,
      ),
      'TapCell',
    );

    const session = new GameSession(buildBoard([[arrow('RIGHT'), empty()]]));

    // Act
    const result = await decorated.execute({ session, position: new Position(0, 0) });

    // Assert: business result is unchanged, and every aspect observed the call.
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(logger.entries.map((e) => e.message)).toEqual(['TapCell: start', 'TapCell: success']);
    expect(metrics.records).toHaveLength(1);
    expect(metrics.records[0].operation).toBe('TapCell');
  });
});
