import type { UseCase } from '../ports/UseCase';
import type { IProgressApi, LevelResult, RemoteProgressRecord } from '../ports/IProgressApi';
import type { ISessionSource } from '../ports/ISessionSource';
import { NotAuthenticatedError } from '../errors';

export interface SyncProgressInput {
  readonly results: LevelResult[];
}

/**
 * Pushes the player's level results to the backend so they count for the
 * global leaderboard. Auth-required: the Composition Root wraps it with the
 * authentication aspect, and it still resolves the token itself (defence in
 * depth) because the API call needs it.
 */
export class SyncProgressUseCase implements UseCase<SyncProgressInput, RemoteProgressRecord[]> {
  constructor(
    private readonly progressApi: IProgressApi,
    private readonly sessions: ISessionSource,
  ) {}

  async execute(input: SyncProgressInput): Promise<RemoteProgressRecord[]> {
    const token = await this.sessions.getToken();
    if (!token) {
      throw new NotAuthenticatedError('SyncProgress');
    }
    return this.progressApi.sync(token, input.results);
  }
}
