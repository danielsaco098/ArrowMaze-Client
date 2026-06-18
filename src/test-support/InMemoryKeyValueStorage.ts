import type { IKeyValueStorage } from '../application/ports/IKeyValueStorage';

/** In-memory {@link IKeyValueStorage} for tests, mirroring AsyncStorage semantics. */
export class InMemoryKeyValueStorage implements IKeyValueStorage {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  /** Test helper: seed a raw value directly (e.g. to simulate corrupt data). */
  seed(key: string, value: string): void {
    this.store.set(key, value);
  }
}
