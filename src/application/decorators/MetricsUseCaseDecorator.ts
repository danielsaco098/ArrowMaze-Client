import { UseCaseDecorator } from './UseCaseDecorator';
import type { UseCase } from '../ports/UseCase';
import type { IMetricsRecorder } from '../ports/IMetricsRecorder';
import type { IClock } from '../ports/IClock';

/**
 * Performance/profiling aspect: measures how long the wrapped use case takes and
 * reports it to the metrics sink. Uses `finally` so the duration is recorded
 * whether the use case succeeds or throws.
 */
export class MetricsUseCaseDecorator<TInput, TOutput> extends UseCaseDecorator<TInput, TOutput> {
  constructor(
    inner: UseCase<TInput, TOutput>,
    operation: string,
    private readonly metrics: IMetricsRecorder,
    private readonly clock: IClock,
  ) {
    super(inner, operation);
  }

  async execute(input: TInput): Promise<TOutput> {
    const startedAt = this.clock.now();
    try {
      return await this.inner.execute(input);
    } finally {
      this.metrics.record(this.operation, this.clock.now() - startedAt);
    }
  }
}
