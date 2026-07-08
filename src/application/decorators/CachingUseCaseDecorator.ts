import { UseCaseDecorator } from './UseCaseDecorator';
import type { UseCase } from '../ports/UseCase';
import type { IClock } from '../ports/IClock';

/**
 * Result-caching aspect: memoizes the wrapped use case's result per input for a
 * time window, so repeated identical calls (e.g. flipping between leaderboard
 * tabs) do not re-hit the network while the data cannot reasonably have
 * changed. The use case itself knows nothing about caching; expiry is driven by
 * the injected {@link IClock}, keeping the aspect deterministic in tests.
 */
export class CachingUseCaseDecorator<TInput, TOutput> extends UseCaseDecorator<TInput, TOutput> {
  private readonly cache = new Map<string, { value: TOutput; expiresAt: number }>();

  constructor(
    inner: UseCase<TInput, TOutput>,
    operation: string,
    private readonly clock: IClock,
    private readonly ttlMs: number,
  ) {
    super(inner, operation);
  }

  async execute(input: TInput): Promise<TOutput> {
    const key = JSON.stringify(input) ?? 'void';
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > this.clock.now()) {
      return hit.value;
    }
    const value = await this.inner.execute(input);
    this.cache.set(key, { value, expiresAt: this.clock.now() + this.ttlMs });
    return value;
  }
}
