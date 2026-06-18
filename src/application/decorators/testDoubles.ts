import type { UseCase } from '../ports/UseCase';
import type { IClock } from '../ports/IClock';
import type { ILogger, LogLevel } from '../ports/ILogger';
import type { IMetricsRecorder } from '../ports/IMetricsRecorder';

/** Clock whose value is fully controlled by the test. */
export class FakeClock implements IClock {
  private current: number;
  constructor(start = 0) {
    this.current = start;
  }
  now(): number {
    return this.current;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/** Logger that records every call. */
export class RecordingLogger implements ILogger {
  readonly entries: LogEntry[] = [];
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level, message, context });
  }
}

/** Metrics sink that records every recorded duration. */
export class RecordingMetrics implements IMetricsRecorder {
  readonly records: Array<{ operation: string; durationMs: number }> = [];
  record(operation: string, durationMs: number): void {
    this.records.push({ operation, durationMs });
  }
}

/** Minimal use case that returns a fixed value, for isolating decorator behavior. */
export class EchoUseCase implements UseCase<number, number> {
  async execute(input: number): Promise<number> {
    return input * 2;
  }
}

/** Use case that fails a configured number of times, then succeeds. */
export class FlakyUseCase implements UseCase<number, number> {
  public calls = 0;
  constructor(private readonly failuresBeforeSuccess: number) {}
  async execute(input: number): Promise<number> {
    this.calls += 1;
    if (this.calls <= this.failuresBeforeSuccess) {
      throw new Error(`transient failure #${this.calls}`);
    }
    return input;
  }
}
