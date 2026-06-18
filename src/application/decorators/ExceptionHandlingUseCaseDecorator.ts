import { UseCaseDecorator } from './UseCaseDecorator';
import type { UseCase } from '../ports/UseCase';

export interface ExceptionHandlingOptions<TInput, TOutput> {
  /** Number of *additional* attempts after the first one fails. Default 0. */
  readonly retries?: number;
  /** Produces a safe result when all attempts fail. If omitted, the error is rethrown. */
  readonly fallback?: (input: TInput, error: unknown) => TOutput | Promise<TOutput>;
  /** Side-effect hook invoked once per failed attempt (e.g. logging). */
  readonly onError?: (error: unknown, attempt: number) => void;
}

/**
 * Centralized exception-handling aspect: wraps the use case with retry and
 * fallback logic so transient network/persistence failures are handled in one
 * place, instead of every use case implementing its own try/catch/retry.
 */
export class ExceptionHandlingUseCaseDecorator<TInput, TOutput> extends UseCaseDecorator<
  TInput,
  TOutput
> {
  private readonly retries: number;
  private readonly fallback?: (input: TInput, error: unknown) => TOutput | Promise<TOutput>;
  private readonly onError?: (error: unknown, attempt: number) => void;

  constructor(
    inner: UseCase<TInput, TOutput>,
    operation: string,
    options: ExceptionHandlingOptions<TInput, TOutput> = {},
  ) {
    super(inner, operation);
    this.retries = options.retries ?? 0;
    this.fallback = options.fallback;
    this.onError = options.onError;
  }

  async execute(input: TInput): Promise<TOutput> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        return await this.inner.execute(input);
      } catch (error) {
        lastError = error;
        this.onError?.(error, attempt);
      }
    }

    if (this.fallback) {
      return this.fallback(input, lastError);
    }
    throw lastError;
  }
}
