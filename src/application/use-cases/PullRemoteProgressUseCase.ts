import type { UseCase } from '../ports/UseCase';
import type { IProgressApi } from '../ports/IProgressApi';
import type { IProgressRepository } from '../ports/IProgressRepository';
import type { ISessionSource } from '../ports/ISessionSource';
import type { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { Score } from '../../domain/value-objects/Score';
import { NotAuthenticatedError } from '../errors';

/**
 * Pulls the signed-in player's progress from the backend and merges it into
 * their local store, keeping the best score per level. Run after login so the
 * levels an account already beat (on any device) unlock again, while accounts
 * that never played start locked — progress belongs to the player, not the
 * device.
 */
export class PullRemoteProgressUseCase implements UseCase<void, PlayerProgress> {
  constructor(
    private readonly progressApi: IProgressApi,
    private readonly progressRepository: IProgressRepository,
    private readonly sessions: ISessionSource,
  ) {}

  async execute(): Promise<PlayerProgress> {
    const token = await this.sessions.getToken();
    if (!token) {
      throw new NotAuthenticatedError('PullRemoteProgress');
    }
    const records = await this.progressApi.getProgress(token);
    let progress = await this.progressRepository.load();
    for (const record of records) {
      progress = progress.recordCompletion(record.levelId, Score.of(record.bestScore));
    }
    await this.progressRepository.save(progress);
    return progress;
  }
}
