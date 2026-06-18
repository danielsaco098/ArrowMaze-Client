import type { IClock } from '../../application/ports/IClock';

/** Real clock backed by the system time (Layer 4). */
export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }
}
