import { SyncProgressUseCase } from './SyncProgressUseCase';
import { NotAuthenticatedError } from '../errors';
import type { IProgressApi } from '../ports/IProgressApi';
import type { ISessionSource } from '../ports/ISessionSource';

const apiMock = (): jest.Mocked<IProgressApi> => ({
  sync: jest.fn().mockResolvedValue([{ levelId: 1, bestScore: 500 }]),
  getProgress: jest.fn().mockResolvedValue([]),
});

const sessionWith = (token: string | null): ISessionSource => ({
  getToken: jest.fn().mockResolvedValue(token),
  getUserId: jest.fn().mockResolvedValue(token === null ? null : 'user-1'),
});

describe('SyncProgressUseCase', () => {
  it('should_sync_results_with_the_session_token_when_signed_in', async () => {
    // Arrange
    const api = apiMock();
    const useCase = new SyncProgressUseCase(api, sessionWith('jwt-token'));

    // Act
    const records = await useCase.execute({ results: [{ levelId: 1, score: 500 }] });

    // Assert
    expect(api.sync).toHaveBeenCalledWith('jwt-token', [{ levelId: 1, score: 500 }]);
    expect(records).toEqual([{ levelId: 1, bestScore: 500 }]);
  });

  it('should_throw_NotAuthenticatedError_when_no_session_is_active', async () => {
    // Arrange
    const api = apiMock();
    const useCase = new SyncProgressUseCase(api, sessionWith(null));

    // Act / Assert
    await expect(useCase.execute({ results: [{ levelId: 1, score: 500 }] })).rejects.toThrow(
      NotAuthenticatedError,
    );
    expect(api.sync).not.toHaveBeenCalled();
  });
});
