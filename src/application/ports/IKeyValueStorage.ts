/**
 * Minimal async key-value storage port. Abstracts the device storage engine
 * (AsyncStorage, SQLite, etc.) so repositories stay testable with an in-memory
 * fake and independent of any framework.
 */
export interface IKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
