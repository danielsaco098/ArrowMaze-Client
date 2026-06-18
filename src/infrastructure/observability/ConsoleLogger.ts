import type { ILogger, LogLevel } from '../../application/ports/ILogger';

/** Logger that writes to the console (Layer 4). */
export class ConsoleLogger implements ILogger {
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const line = context ? `[${level}] ${message} ${JSON.stringify(context)}` : `[${level}] ${message}`;
    // eslint-disable-next-line no-console
    console[level](line);
  }
}
