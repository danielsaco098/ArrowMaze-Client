import type { IMetricsRecorder } from '../../application/ports/IMetricsRecorder';

/** Metrics sink that reports timings to the console in development (Layer 4). */
export class ConsoleMetricsRecorder implements IMetricsRecorder {
  record(operation: string, durationMs: number): void {
    // eslint-disable-next-line no-console
    console.debug(`[metric] ${operation} took ${durationMs}ms`);
  }
}
