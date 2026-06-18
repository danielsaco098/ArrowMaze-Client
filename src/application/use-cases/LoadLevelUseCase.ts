import type { UseCase } from '../ports/UseCase';
import type { ILevelRepository } from '../ports/ILevelRepository';
import type { Level } from '../../domain/entities/Level';
import { GameSession } from '../../domain/entities/GameSession';

export interface LoadLevelInput {
  readonly levelId: number;
}

export interface LoadLevelOutput {
  readonly level: Level;
  readonly session: GameSession;
}

/**
 * Loads a level by id through the repository port and returns a fresh
 * {@link GameSession} ready to play. Knows nothing about where levels come from
 * (bundled JSON, REST, cache) — only the {@link ILevelRepository} abstraction.
 */
export class LoadLevelUseCase implements UseCase<LoadLevelInput, LoadLevelOutput> {
  constructor(private readonly levels: ILevelRepository) {}

  async execute({ levelId }: LoadLevelInput): Promise<LoadLevelOutput> {
    const level = await this.levels.getById(levelId);
    const session = new GameSession(level.board);
    return { level, session };
  }
}
