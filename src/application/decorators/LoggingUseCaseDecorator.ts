import { UseCaseDecorator } from './UseCaseDecorator';
import type { UseCase } from '../ports/UseCase';
import type { ILogger } from '../ports/ILogger';
import type { IClock } from '../ports/IClock';

/**
 * Logging & tracing aspect: records the entry, exit and duration of the wrapped
 * use case (and any error), without a single logger call living in the business
 * code. Satisfies the "intercept execute() to trace before/after" requirement.
 */
export class LoggingUseCaseDecorator<TInput, TOutput> extends UseCaseDecorator<TInput, TOutput> {
  constructor(
    inner: UseCase<TInput, TOutput>,
    operation: string,
    private readonly logger: ILogger,
    private readonly clock: IClock,
  ) {
    super(inner, operation);
  }

  async execute(input: TInput): Promise<TOutput> {
    const startedAt = this.clock.now();
    this.logger.log('info', `${this.operation}: start`, { input });

    try {
      const output = await this.inner.execute(input);
      this.logger.log('info', `${this.operation}: success`, {
        durationMs: this.clock.now() - startedAt,
      });
      return output;
    } catch (error) {
      this.logger.log('error', `${this.operation}: failure`, {
        durationMs: this.clock.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
