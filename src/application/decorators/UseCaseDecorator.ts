import type { UseCase } from '../ports/UseCase';

/**
 * Base Decorator for use cases — the heart of our library-free AOP strategy.
 *
 * Because every use case implements the same {@link UseCase} contract, a
 * decorator can wrap any of them, add a cross-cutting concern, and forward the
 * call to the wrapped instance. Decorators compose, so concerns stack without
 * the business code (or the other concerns) knowing about each other.
 */
export abstract class UseCaseDecorator<TInput, TOutput> implements UseCase<TInput, TOutput> {
  protected constructor(
    protected readonly inner: UseCase<TInput, TOutput>,
    /** Human-readable name of the wrapped use case, used in logs and metrics. */
    protected readonly operation: string,
  ) {}

  abstract execute(input: TInput): Promise<TOutput>;
}
