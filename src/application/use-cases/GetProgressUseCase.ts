import type { UseCase } from '../ports/UseCase';
import type { IProgressRepository } from '../ports/IProgressRepository';
import type { PlayerProgress } from '../../domain/entities/PlayerProgress';

/**
 * Loads the player's progress (for the level-select screen: which levels are
 * completed, unlocked, and their best scores).
 */
export class GetProgressUseCase implements UseCase<void, PlayerProgress> {
  constructor(private readonly progressRepository: IProgressRepository) {}

  async execute(): Promise<PlayerProgress> {
    return this.progressRepository.load();
  }
}
