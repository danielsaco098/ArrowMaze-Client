import { LoggingUseCaseDecorator } from './LoggingUseCaseDecorator';
import { EchoUseCase, FakeClock, FlakyUseCase, RecordingLogger } from './testDoubles';
import type { UseCase } from '../ports/UseCase';

/** Inner use case that consumes 5ms of clock time before returning. */
class SlowUseCase implements UseCase<number, number> {
  constructor(private readonly clock: FakeClock) {}
  async execute(input: number): Promise<number> {
    this.clock.advance(5);
    return input;
  }
}

describe('LoggingUseCaseDecorator', () => {
  it('should_delegate_to_inner_and_return_its_result', async () => {
    // Arrange
    const decorator = new LoggingUseCaseDecorator(
      new EchoUseCase(),
      'Echo',
      new RecordingLogger(),
      new FakeClock(),
    );

    // Act
    const result = await decorator.execute(5);

    // Assert
    expect(result).toBe(10);
  });

  it('should_log_start_and_success_with_duration_when_inner_succeeds', async () => {
    // Arrange
    const clock = new FakeClock();
    const logger = new RecordingLogger();
    const decorator = new LoggingUseCaseDecorator(new SlowUseCase(clock), 'Slow', logger, clock);

    // Act
    await decorator.execute(1);

    // Assert
    expect(logger.entries.map((e) => e.message)).toEqual(['Slow: start', 'Slow: success']);
    expect(logger.entries[1].context).toMatchObject({ durationMs: 5 });
  });

  it('should_log_error_and_rethrow_when_inner_throws', async () => {
    // Arrange
    const logger = new RecordingLogger();
    const decorator = new LoggingUseCaseDecorator(
      new FlakyUseCase(1),
      'Flaky',
      logger,
      new FakeClock(),
    );

    // Act / Assert
    await expect(decorator.execute(1)).rejects.toThrow('transient failure #1');
    const last = logger.entries[logger.entries.length - 1];
    expect(last.level).toBe('error');
    expect(last.message).toBe('Flaky: failure');
  });
});
