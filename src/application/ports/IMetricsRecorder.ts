/**
 * Port for recording performance metrics. The metrics decorator reports each
 * use case's execution time here; the concrete sink lives in Layer 4.
 */
export interface IMetricsRecorder {
  record(operation: string, durationMs: number): void;
}
