import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import type { AuthSession } from '../../application/ports/IAuthApi';
import type { ISessionSource } from '../../application/ports/ISessionSource';

/**
 * Persists the authenticated session (token + user) in key-value storage so the
 * player stays logged in across app restarts. Corrupt data falls back to "no
 * session" rather than crashing. Implements {@link ISessionSource} so the
 * application layer can check for an active session without knowing about
 * storage.
 */
export class SessionStore implements ISessionSource {
  private static readonly STORAGE_KEY = 'arrowmaze.session.v1';

  constructor(private readonly storage: IKeyValueStorage) {}

  async getToken(): Promise<string | null> {
    return (await this.load())?.accessToken ?? null;
  }

  async load(): Promise<AuthSession | null> {
    const raw = await this.storage.getItem(SessionStore.STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  async save(session: AuthSession): Promise<void> {
    await this.storage.setItem(SessionStore.STORAGE_KEY, JSON.stringify(session));
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(SessionStore.STORAGE_KEY);
  }
}
