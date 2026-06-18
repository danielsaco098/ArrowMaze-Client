/**
 * Port abstracting the current time. Injecting it keeps the timing-based
 * decorators (logging duration, metrics) deterministic and unit-testable.
 */
export interface IClock {
  /** Milliseconds since an arbitrary but monotonic epoch. */
  now(): number;
}
