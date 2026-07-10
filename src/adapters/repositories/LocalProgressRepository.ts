import type { IProgressRepository } from '../../application/ports/IProgressRepository';
import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import type { ISessionSource } from '../../application/ports/ISessionSource';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { ProgressMapper } from '../mappers/ProgressMapper';

/**
 * Persists progress in a key-value store (Adapter over {@link IKeyValueStorage}).
 *
 * Progress is stored per player: each signed-in user gets their own storage key
 * (so one player's unlocked levels never leak to another account on the same
 * device), and guest play uses the legacy un-suffixed key.
 *
 * If nothing is stored yet, or the stored payload is corrupt, it returns empty
 * progress instead of failing — a missing/garbled save should never block play.
 */
export class LocalProgressRepository implements IProgressRepository {
  private static readonly STORAGE_KEY = 'arrowmaze.progress.v1';

  constructor(
    private readonly storage: IKeyValueStorage,
    private readonly sessions: ISessionSource | null = null,
    private readonly mapper: ProgressMapper = new ProgressMapper(),
  ) {}

  async load(): Promise<PlayerProgress> {
    const raw = await this.storage.getItem(await this.storageKey());
    if (!raw) {
      return PlayerProgress.empty();
    }
    try {
      return this.mapper.deserialize(raw);
    } catch {
      return PlayerProgress.empty();
    }
  }

  async save(progress: PlayerProgress): Promise<void> {
    await this.storage.setItem(await this.storageKey(), this.mapper.serialize(progress));
  }

  private async storageKey(): Promise<string> {
    const userId = (await this.sessions?.getUserId()) ?? null;
    return userId === null
      ? LocalProgressRepository.STORAGE_KEY
      : `${LocalProgressRepository.STORAGE_KEY}.user.${userId}`;
  }
}
