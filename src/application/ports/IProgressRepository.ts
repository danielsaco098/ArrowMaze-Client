import type { PlayerProgress } from '../../domain/entities/PlayerProgress';

/**
 * Port for persisting the player's progress. Use cases depend on this; the
 * concrete store (local key-value, remote sync) lives in an outer layer.
 */
export interface IProgressRepository {
  load(): Promise<PlayerProgress>;
  save(progress: PlayerProgress): Promise<void>;
}
