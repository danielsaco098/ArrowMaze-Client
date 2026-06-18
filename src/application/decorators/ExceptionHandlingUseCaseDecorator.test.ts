import { ExceptionHandlingUseCaseDecorator } from './ExceptionHandlingUseCaseDecorator';
import { EchoUseCase, FlakyUseCase } from './testDoubles';

describe('ExceptionHandlingUseCaseDecorator', () => {
  it('should_return_the_inner_result_when_no_error_occurs', async () => {
    // Arrange
    const decorator = new ExceptionHandlingUseCaseDecorator(new EchoUseCase(), 'Echo');

    // Act / Assert
    expect(await decorator.execute(3)).toBe(6);
  });

  it('should_retry_until_success_when_inner_fails_then_succeeds', async () => {
    // Arrange: fails twice, succeeds on the third attempt
    const inner = new FlakyUseCase(2);
    const decorator = new ExceptionHandlingUseCaseDecorator(inner, 'Flaky', { retries: 2 });

    // Act
    const result = await decorator.execute(42);

    // Assert
    expect(result).toBe(42);
    expect(inner.calls).toBe(3);
  });

  it('should_return_the_fallback_when_all_attempts_are_exhausted', async () => {
    // Arrange
    const decorator = new ExceptionHandlingUseCaseDecorator(new FlakyUseCase(99), 'Flaky', {
      retries: 1,
      fallback: () => -1,
    });

    // Act / Assert
    expect(await decorator.execute(0)).toBe(-1);
  });

  it('should_rethrow_when_no_fallback_is_provided', async () => {
    // Arrange
    const decorator = new ExceptionHandlingUseCaseDecorator(new FlakyUseCase(99), 'Flaky', {
      retries: 0,
    });

    // Act / Assert
    await expect(decorator.execute(0)).rejects.toThrow('transient failure #1');
  });

  it('should_invoke_onError_once_per_failed_attempt', async () => {
    // Arrange
    const onError = jest.fn();
    const decorator = new ExceptionHandlingUseCaseDecorator(new FlakyUseCase(99), 'Flaky', {
      retries: 2,
      fallback: () => 0,
      onError,
    });

    // Act
    await decorator.execute(0);

    // Assert: initial attempt + 2 retries = 3 failures
    expect(onError).toHaveBeenCalledTimes(3);
  });
});
