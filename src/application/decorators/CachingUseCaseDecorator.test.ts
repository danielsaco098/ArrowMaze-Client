import { CachingUseCaseDecorator } from './CachingUseCaseDecorator';
import type { UseCase } from '../ports/UseCase';
import type { IClock } from '../ports/IClock';

class FakeClock implements IClock {
  constructor(private current = 0) {}
  now(): number {
    return this.current;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

describe('CachingUseCaseDecorator', () => {
  it('should_serve_repeated_calls_from_cache_within_the_ttl', async () => {
    // Arrange
    const inner: UseCase<{ levelId: number }, string> = {
      execute: jest.fn().mockResolvedValue('entries'),
    };
    const clock = new FakeClock();
    const cached = new CachingUseCaseDecorator(inner, 'GetLeaderboard', clock, 15_000);

    // Act
    await cached.execute({ levelId: 1 });
    clock.advance(5_000);
    const second = await cached.execute({ levelId: 1 });

    // Assert: one real call, second served from cache
    expect(second).toBe('entries');
    expect(inner.execute).toHaveBeenCalledTimes(1);
  });

  it('should_refetch_after_the_ttl_expires', async () => {
    // Arrange
    const inner: UseCase<{ levelId: number }, string> = {
      execute: jest.fn().mockResolvedValue('entries'),
    };
    const clock = new FakeClock();
    const cached = new CachingUseCaseDecorator(inner, 'GetLeaderboard', clock, 15_000);

    // Act
    await cached.execute({ levelId: 1 });
    clock.advance(15_001);
    await cached.execute({ levelId: 1 });

    // Assert
    expect(inner.execute).toHaveBeenCalledTimes(2);
  });

  it('should_cache_each_distinct_input_separately', async () => {
    // Arrange
    const inner: UseCase<{ levelId: number }, string> = {
      execute: jest.fn().mockImplementation(async ({ levelId }) => `entries-${levelId}`),
    };
    const cached = new CachingUseCaseDecorator(inner, 'GetLeaderboard', new FakeClock(), 15_000);

    // Act
    const first = await cached.execute({ levelId: 1 });
    const second = await cached.execute({ levelId: 2 });

    // Assert
    expect(first).toBe('entries-1');
    expect(second).toBe('entries-2');
    expect(inner.execute).toHaveBeenCalledTimes(2);
  });
});
