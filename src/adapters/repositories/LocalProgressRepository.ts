import type { IProgressRepository } from '../../application/ports/IProgressRepository';
import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { ProgressMapper } from '../mappers/ProgressMapper';

/**
 * Persists progress in a key-value store (Adapter over {@link IKeyValueStorage}).
 *
 * If nothing is stored yet, or the stored payload is corrupt, it returns empty
 * progress instead of failing — a missing/garbled save should never block play.
 */
export class LocalProgressRepository implements IProgressRepository {
  private static readonly STORAGE_KEY = 'arrowmaze.progress.v1';

  constructor(
    private readonly storage: IKeyValueStorage,
    private readonly mapper: ProgressMapper = new ProgressMapper(),
  ) {}

  async load(): Promise<PlayerProgress> {
    const raw = await this.storage.getItem(LocalProgressRepository.STORAGE_KEY);
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
    await this.storage.setItem(LocalProgressRepository.STORAGE_KEY, this.mapper.serialize(progress));
  }
}
