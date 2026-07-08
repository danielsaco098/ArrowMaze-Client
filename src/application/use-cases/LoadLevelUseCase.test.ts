import { LoadLevelUseCase } from './LoadLevelUseCase';
import type { ILevelRepository } from '../ports/ILevelRepository';
import { LevelNotFoundError } from '../errors';
import { Level } from '../../domain/entities/Level';
import { GameStatus } from '../../domain/entities/GameStatus';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';

/** In-memory fake repository for use-case isolation tests. */
class FakeLevelRepository implements ILevelRepository {
  constructor(private readonly levels: Map<number, Level>) {}

  async getById(id: number): Promise<Level> {
    const level = this.levels.get(id);
    if (!level) {
      throw new LevelNotFoundError(id);
    }
    return level;
  }

  async getAll(): Promise<Level[]> {
    return [...this.levels.values()];
  }
}

const buildLevel = (id: number) =>
  new Level(id, `Level ${id}`, 'EASY', buildBoard([[arrow('RIGHT'), empty()]]));

describe('LoadLevelUseCase', () => {
  it('should_return_the_level_and_a_playable_session_when_the_level_exists', async () => {
    // Arrange
    const repo = new FakeLevelRepository(new Map([[1, buildLevel(1)]]));
    const useCase = new LoadLevelUseCase(repo);

    // Act
    const output = await useCase.execute({ levelId: 1 });

    // Assert
    expect(output.level.id).toBe(1);
    expect(output.session.status).toBe(GameStatus.Playing);
    expect(output.session.arrowsRemaining).toBe(1);
  });

  it('should_propagate_LevelNotFoundError_when_the_level_does_not_exist', async () => {
    // Arrange
    const repo = new FakeLevelRepository(new Map());
    const useCase = new LoadLevelUseCase(repo);

    // Act / Assert
    await expect(useCase.execute({ levelId: 99 })).rejects.toThrow(LevelNotFoundError);
  });

  it('should_build_an_independent_board_when_the_same_level_is_loaded_twice', async () => {
    // Arrange: the same id loaded twice should yield independent sessions
    const repo = new FakeLevelRepository(
      new Map([
        [1, buildLevel(1)],
        [2, buildLevel(2)],
      ]),
    );
    const useCase = new LoadLevelUseCase(repo);

    // Act
    const first = await useCase.execute({ levelId: 1 });
    const second = await useCase.execute({ levelId: 2 });

    // Assert
    expect(first.session).not.toBe(second.session);
    expect(first.level.id).toBe(1);
    expect(second.level.id).toBe(2);
  });
});
