import type { Level } from '../../domain/entities/Level';

/**
 * Port for retrieving level definitions (Dependency Inversion).
 *
 * Use cases depend only on this interface; concrete implementations (bundled
 * JSON, remote REST, local cache) live in Layer 3 and can be swapped freely.
 * Implementations must return a freshly-built level each call so a replay starts
 * from the original, unmutated board.
 */
export interface ILevelRepository {
  /** @throws LevelNotFoundError when no level matches the id. */
  getById(id: number): Promise<Level>;

  /** All available levels, ordered by id (used by the level-select screen). */
  getAll(): Promise<Level[]>;
}
