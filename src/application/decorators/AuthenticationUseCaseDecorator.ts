import { UseCaseDecorator } from './UseCaseDecorator';
import type { UseCase } from '../ports/UseCase';
import type { ISessionSource } from '../ports/ISessionSource';
import { NotAuthenticatedError } from '../errors';

/**
 * Authentication aspect: automatically verifies that an active session exists
 * BEFORE the wrapped use case runs, and rejects with
 * {@link NotAuthenticatedError} otherwise. Auth-required use cases (progress
 * sync, global leaderboard, ...) are wrapped with this decorator in the
 * Composition Root, so neither the business code nor the UI repeats the check.
 */
export class AuthenticationUseCaseDecorator<TInput, TOutput> extends UseCaseDecorator<
  TInput,
  TOutput
> {
  constructor(
    inner: UseCase<TInput, TOutput>,
    operation: string,
    private readonly sessions: ISessionSource,
  ) {
    super(inner, operation);
  }

  async execute(input: TInput): Promise<TOutput> {
    const token = await this.sessions.getToken();
    if (!token) {
      throw new NotAuthenticatedError(this.operation);
    }
    return this.inner.execute(input);
  }
}
