export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Port for structured logging. The logging decorator depends on this so the
 * business code never references a concrete logger (Dependency Inversion); the
 * real sink (console, file, remote) is wired in at the composition root.
 */
export interface ILogger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
}
