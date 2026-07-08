import { MetricsUseCaseDecorator } from './MetricsUseCaseDecorator';
import { EchoUseCase, FakeClock, FlakyUseCase, RecordingMetrics } from './testDoubles';
import type { UseCase } from '../ports/UseCase';

class SlowUseCase implements UseCase<number, number> {
  constructor(private readonly clock: FakeClock) {}
  async execute(input: number): Promise<number> {
    this.clock.advance(7);
    return input;
  }
}

describe('MetricsUseCaseDecorator', () => {
  it('should_return_the_inner_result_when_the_use_case_succeeds', async () => {
    // Arrange
    const decorator = new MetricsUseCaseDecorator(
      new EchoUseCase(),
      'Echo',
      new RecordingMetrics(),
      new FakeClock(),
    );

    // Act / Assert
    expect(await decorator.execute(4)).toBe(8);
  });

  it('should_record_the_execution_duration_when_inner_succeeds', async () => {
    // Arrange
    const clock = new FakeClock();
    const metrics = new RecordingMetrics();
    const decorator = new MetricsUseCaseDecorator(new SlowUseCase(clock), 'Slow', metrics, clock);

    // Act
    await decorator.execute(1);

    // Assert
    expect(metrics.records).toEqual([{ operation: 'Slow', durationMs: 7 }]);
  });

  it('should_record_a_metric_even_when_inner_throws', async () => {
    // Arrange
    const metrics = new RecordingMetrics();
    const decorator = new MetricsUseCaseDecorator(
      new FlakyUseCase(1),
      'Flaky',
      metrics,
      new FakeClock(),
    );

    // Act
    await expect(decorator.execute(1)).rejects.toThrow();

    // Assert: the `finally` block still records the timing
    expect(metrics.records).toHaveLength(1);
    expect(metrics.records[0].operation).toBe('Flaky');
  });
});
