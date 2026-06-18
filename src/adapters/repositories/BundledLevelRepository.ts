import type { ILevelRepository } from '../../application/ports/ILevelRepository';
import type { ILevelBuilder, LevelData } from '../../application/ports/ILevelBuilder';
import { JsonLevelBuilder } from '../builders/JsonLevelBuilder';
import { Level } from '../../domain/entities/Level';
import { LevelNotFoundError } from '../../application/errors';

/**
 * Level repository backed by level definitions bundled with the app (offline).
 *
 * Adapter + Strategy: it adapts a static list of {@link LevelData} to the
 * {@link ILevelRepository} port, building a fresh {@link Level} on each call via
 * the injected {@link ILevelBuilder}. Because every call rebuilds the board, a
 * replay always starts from the original, unmutated layout. A future
 * `RestLevelRepository` can replace it without touching the use cases.
 */
export class BundledLevelRepository implements ILevelRepository {
  constructor(
    private readonly definitions: ReadonlyArray<LevelData>,
    private readonly builder: ILevelBuilder = new JsonLevelBuilder(),
  ) {}

  async getById(id: number): Promise<Level> {
    const definition = this.definitions.find((d) => d.id === id);
    if (!definition) {
      throw new LevelNotFoundError(id);
    }
    return this.builder.build(definition);
  }

  async getAll(): Promise<Level[]> {
    return [...this.definitions]
      .sort((a, b) => a.id - b.id)
      .map((definition) => this.builder.build(definition));
  }
}
