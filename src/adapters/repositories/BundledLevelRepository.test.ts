import { BundledLevelRepository } from './BundledLevelRepository';
import { LevelNotFoundError } from '../../application/errors';
import type { LevelData } from '../../application/ports/ILevelBuilder';

const data: ReadonlyArray<LevelData> = [
  { id: 1, name: 'One', difficulty: 'EASY', rows: 2, cols: 2, cells: [{ row: 0, col: 0, kind: 'ARROW', direction: 'RIGHT' }] },
  { id: 2, name: 'Two', difficulty: 'EASY', rows: 2, cols: 2, cells: [{ row: 1, col: 1, kind: 'ARROW', direction: 'LEFT' }] },
];

describe('BundledLevelRepository', () => {
  it('should_build_and_return_the_level_when_the_id_exists', async () => {
    // Arrange
    const repo = new BundledLevelRepository(data);

    // Act
    const level = await repo.getById(2);

    // Assert
    expect(level.id).toBe(2);
    expect(level.name).toBe('Two');
  });

  it('should_throw_LevelNotFoundError_when_the_id_is_unknown', async () => {
    // Arrange
    const repo = new BundledLevelRepository(data);

    // Act / Assert
    await expect(repo.getById(99)).rejects.toThrow(LevelNotFoundError);
  });

  it('should_return_all_levels_sorted_by_id', async () => {
    // Arrange: definitions provided out of order
    const repo = new BundledLevelRepository([data[1], data[0]]);

    // Act
    const levels = await repo.getAll();

    // Assert
    expect(levels.map((l) => l.id)).toEqual([1, 2]);
  });

  it('should_return_independent_board_instances_on_repeated_loads', async () => {
    // Arrange
    const repo = new BundledLevelRepository(data);

    // Act
    const first = await repo.getById(1);
    const second = await repo.getById(1);

    // Assert: a replay must not share mutable board state
    expect(first.board).not.toBe(second.board);
  });
});
