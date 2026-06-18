/**
 * Generic contract every use case implements.
 *
 * A single uniform signature is what lets cross-cutting concerns (logging,
 * metrics, exception handling) be added later as Decorators around any use case
 * without the business code knowing about them — our library-free AOP strategy.
 */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
