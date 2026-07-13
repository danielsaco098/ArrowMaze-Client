import { createContainer } from './container';
import { CUBE_FACE_SIZE } from '../data/cubeLevels';
import { CubeLayout } from '../../adapters/cube/CubeLayout';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { GameStatus } from '../../domain/entities/GameStatus';

/**
 * Integration test through the REAL container wiring (composition root →
 * decorators → BundledLevelRepository → JsonLevelBuilder), the same path the app
 * takes when a player opens level 16. This exercises the seam the unit tests skip
 * by building the composed level straight from the composer.
 */
describe('loading level 16 (the cube) through the container', () => {
  it('should_load_a_playable_30x30_board_with_arrows_on_all_six_faces', async () => {
    // Arrange
    const container = createContainer();

    // Act
    const { level, session } = await container.loadLevel.execute({ levelId: 16 });

    // Assert: a full 30×30 cube board, ready to play, with every face populated.
    expect(level.board.rows).toBe(CUBE_FACE_SIZE * 6);
    expect(level.board.cols).toBe(CUBE_FACE_SIZE * 6);
    expect(level.board.arrowCount()).toBeGreaterThanOrEqual(6);
    expect(session.status).toBe(GameStatus.Playing);

    const layout = new CubeLayout(CUBE_FACE_SIZE);
    const faces = new Set(
      level.board.arrowIds().filter((id) => id > 0).map((id) => layout.faceOfArrowId(id)),
    );
    expect([...faces].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should_return_independent_boards_on_successive_loads', async () => {
    // Arrange
    const container = createContainer();

    // Act: load the same level twice (two separate plays).
    const first = await container.loadLevel.execute({ levelId: 16 });
    const second = await container.loadLevel.execute({ levelId: 16 });

    // Assert: distinct board instances…
    expect(first.level.board).not.toBe(second.level.board);

    // …and no shared mutable state: clearing an arrow on the first board (as a
    // tap would) leaves the second board — a concurrent/replay session — intact.
    const arrow = first.level.board.cells().find((c) => c instanceof ArrowCell) as ArrowCell;
    const secondCountBefore = second.level.board.arrowCount();
    first.level.board.clearArrow(arrow.arrowId);

    expect(first.level.board.arrowCount()).toBeLessThan(secondCountBefore);
    expect(second.level.board.arrowCount()).toBe(secondCountBefore);
  });
});
