import { RestLevelRepository } from './RestLevelRepository';
import { LevelNotFoundError } from '../../application/errors';
import { HttpError } from '../../application/ports/IHttpClient';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { Position } from '../../domain/value-objects/Position';
import { FakeHttpClient } from '../../test-support/FakeHttpClient';
import type { LevelData } from '../../application/ports/ILevelBuilder';

const sampleLevel: LevelData = {
  id: 1,
  name: 'First Steps',
  difficulty: 'EASY',
  rows: 1,
  cols: 2,
  cells: [{ row: 0, col: 0, kind: 'ARROW', direction: 'RIGHT' }],
};

describe('RestLevelRepository', () => {
  it('should_fetch_and_build_the_level_when_requested_by_id', async () => {
    // Arrange
    const http = new FakeHttpClient(() => sampleLevel);
    const repo = new RestLevelRepository(http);

    // Act
    const level = await repo.getById(1);

    // Assert
    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/levels/1' });
    expect(level.name).toBe('First Steps');
    expect(level.board.cellAt(new Position(0, 0))).toBeInstanceOf(ArrowCell);
  });

  it('should_translate_a_404_into_LevelNotFoundError', async () => {
    // Arrange
    const http = new FakeHttpClient(() => {
      throw new HttpError(404, 'not found');
    });
    const repo = new RestLevelRepository(http);

    // Act / Assert
    await expect(repo.getById(99)).rejects.toThrow(LevelNotFoundError);
  });

  it('should_fetch_and_build_every_level_when_listing_all', async () => {
    // Arrange
    const http = new FakeHttpClient(() => [sampleLevel, { ...sampleLevel, id: 2, name: 'Second' }]);
    const repo = new RestLevelRepository(http);

    // Act
    const levels = await repo.getAll();

    // Assert
    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/levels' });
    expect(levels.map((l) => l.id)).toEqual([1, 2]);
  });
});
