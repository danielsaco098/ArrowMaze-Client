import { BUNDLED_LEVELS } from './bundledLevels';
import { CUBE_FACE_SIZE } from './cubeLevels';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';
import { BundledLevelRepository } from '../../adapters/repositories/BundledLevelRepository';
import { CubeLayout } from '../../adapters/cube/CubeLayout';
import { Board } from '../../domain/entities/Board';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { PathTraversalService } from '../../domain/services/PathTraversalService';

const builder = new JsonLevelBuilder();
const traversal = new PathTraversalService();

/**
 * Greedy solver used as an oracle: repeatedly tap any arrow whose path is
 * currently clear. Removing a free arrow only ever opens paths (never closes
 * them), so this is a complete solvability check — it clears the board iff the
 * level is solvable. Returns the number of arrows left stuck.
 */
function remainingAfterGreedySolve(board: Board): number {
  let progressed = true;
  while (progressed && board.arrowCount() > 0) {
    progressed = false;
    for (const cell of board.cells()) {
      if (cell instanceof ArrowCell && traversal.canEscape(board, cell.position)) {
        board.clearArrow(cell.arrowId);
        progressed = true;
        break;
      }
    }
  }
  return board.arrowCount();
}

/**
 * The fifteen flat, single-board generated levels. Only TWO conventions below are
 * scoped to them, because the cube (level 16) violates exactly two by design:
 * dense fill (its padding is most of the board — the escape medium off a face
 * edge) and HARD ⇒ timed (a timer racing arrows you must orbit to see would be
 * punitive). Every other convention — walls, stars, multi-cell arrows, the build
 * + solvability proof — applies to the cube like any other level.
 */
const FLAT_LEVELS = BUNDLED_LEVELS.filter((l) => l.id <= 15);

describe('bundled levels', () => {
  it('should_expose_16_unique_sequential_ids_when_levels_are_bundled', () => {
    // Assert
    expect(BUNDLED_LEVELS).toHaveLength(16);
    expect(BUNDLED_LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it('should_order_difficulties_progressively_when_levels_are_bundled', () => {
    // Assert: 5 EASY, 5 MEDIUM, then HARD through the end (levels 11–15 and the cube).
    const difficulties = BUNDLED_LEVELS.map((l) => l.difficulty);
    expect(difficulties.slice(0, 5)).toEqual(Array(5).fill('EASY'));
    expect(difficulties.slice(5, 10)).toEqual(Array(5).fill('MEDIUM'));
    expect(difficulties.slice(10)).toEqual(Array(6).fill('HARD'));
  });

  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_build_a_playable_board_with_arrows_for_level_%i_%s',
    (id) => {
      // Arrange
      const data = BUNDLED_LEVELS.find((l) => l.id === id)!;

      // Act
      const level = builder.build(data);

      // Assert
      expect(level.board).toBeInstanceOf(Board);
      expect(level.board.arrowCount()).toBeGreaterThan(0);
    },
  );

  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_be_fully_solvable_for_level_%i_%s',
    (id) => {
      // Arrange
      const data = BUNDLED_LEVELS.find((l) => l.id === id)!;
      const board = builder.build(data).board;

      // Act
      const stuck = remainingAfterGreedySolve(board);

      // Assert
      expect(stuck).toBe(0);
    },
  );

  it('should_fill_every_board_densely_when_levels_are_generated', () => {
    for (const level of FLAT_LEVELS) {
      const occupied = level.cells.filter(
        (c) => c.kind === 'ARROW' || c.kind === 'WALL' || c.kind === 'COLLECTIBLE',
      ).length;
      const fill = occupied / (level.rows * level.cols);
      expect(fill).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('should_place_stars_only_when_difficulty_is_medium_or_hard', () => {
    for (const level of BUNDLED_LEVELS) {
      const stars = level.cells.filter((c) => c.kind === 'COLLECTIBLE').length;
      if (level.difficulty === 'EASY') {
        expect(stars).toBe(0);
      } else {
        expect(stars).toBeGreaterThan(0);
      }
    }
  });

  it('should_set_a_time_limit_only_when_difficulty_is_hard', () => {
    // The cube (level 16) is HARD yet deliberately untimed, so it is excluded here
    // and its untimedness is asserted in the cube-specific block below.
    for (const level of FLAT_LEVELS) {
      if (level.difficulty === 'HARD') {
        expect(level.timeLimitSeconds).toBeGreaterThan(0);
      } else {
        expect(level.timeLimitSeconds).toBeUndefined();
      }
    }
  });

  it('should_include_walls_only_when_difficulty_is_medium_or_hard', () => {
    for (const level of BUNDLED_LEVELS) {
      const walls = level.cells.filter((c) => c.kind === 'WALL').length;
      if (level.difficulty === 'EASY') {
        expect(walls).toBe(0);
      } else {
        expect(walls).toBeGreaterThan(0);
      }
    }
  });

  it('should_use_multi_cell_arrows_when_difficulty_is_medium_or_hard', () => {
    for (const level of BUNDLED_LEVELS.filter((l) => l.difficulty !== 'EASY')) {
      const sizeByArrow = new Map<number, number>();
      for (const cell of level.cells) {
        if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
          sizeByArrow.set(cell.arrowId, (sizeByArrow.get(cell.arrowId) ?? 0) + 1);
        }
      }
      const hasMultiCell = [...sizeByArrow.values()].some((len) => len >= 2);
      expect(hasMultiCell).toBe(true);
    }
  });

  // Level 16 — the cube — is bundled like any other level and must pass the same
  // build + solvability proof (via the it.each above), but its per-board shape is
  // deliberately different from the flat progression, so it is asserted here.
  describe('level 16 — the cube', () => {
    const cube = BUNDLED_LEVELS.find((l) => l.id === 16)!;

    it('should_be_a_hard_untimed_30x30_level', () => {
      // Assert: HARD but, unlike every other HARD level, no time limit (by design).
      expect(cube.difficulty).toBe('HARD');
      expect(cube.timeLimitSeconds).toBeUndefined();
      expect(cube.rows).toBe(CUBE_FACE_SIZE * 6);
      expect(cube.cols).toBe(CUBE_FACE_SIZE * 6);
    });

    it('should_be_sparse_by_design_with_content_confined_to_six_faces', () => {
      // Assert: content lives only on the six N×N faces (≤ 150 cells), so the
      // board is far below the 0.8 fill the flat levels require — that empty
      // padding is exactly what lets arrows escape off a face edge.
      const content = cube.cells.filter((c) => c.kind !== 'EMPTY').length;
      expect(content).toBeLessThanOrEqual(6 * CUBE_FACE_SIZE * CUBE_FACE_SIZE);
      expect(content / (cube.rows * cube.cols)).toBeLessThan(0.8);
    });

    it('should_spread_globally_unique_arrow_ids_across_all_six_faces', () => {
      // Arrange
      const board = builder.build(cube).board;
      const layout = new CubeLayout(CUBE_FACE_SIZE);
      const ids = board.arrowIds();

      // Assert: ids are unique and every face contributes at least one arrow.
      expect(new Set(ids).size).toBe(ids.length);
      const faces = new Set(ids.filter((id) => id > 0).map((id) => layout.faceOfArrowId(id)));
      expect([...faces].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should_put_a_wall_and_stars_on_every_face', () => {
      // Assert over the FACE cells: the cube is HARD, so each of the six faces
      // must carry the HARD furniture — at least one wall detour and at least
      // one collectible star (the global stars/walls conventions above only see
      // level totals; this pins the per-face distribution).
      const layout = new CubeLayout(CUBE_FACE_SIZE);
      for (let faceIndex = 0; faceIndex < 6; faceIndex += 1) {
        const onFace = cube.cells.filter((c) => layout.faceAt(c.row, c.col) === faceIndex);
        const walls = onFace.filter((c) => c.kind === 'WALL').length;
        const stars = onFace.filter((c) => c.kind === 'COLLECTIBLE').length;
        expect({ faceIndex, walls: walls >= 1 }).toEqual({ faceIndex, walls: true });
        expect({ faceIndex, stars: stars >= 1 }).toEqual({ faceIndex, stars: true });
      }
    });

    it('should_start_with_at_least_one_blocked_arrow_so_the_cube_is_a_puzzle', () => {
      // A cube where every arrow escapes on the first tap is a tapping exercise,
      // not a level: solving must require ORDER. So at least one arrow has to be
      // blocked on the initial board (by a wall or another arrow on its own face).
      const board = builder.build(cube).board;
      const holes = new Set(
        board
          .cells()
          .filter((c) => c.kind === 'EMPTY')
          .map((c) => `${c.position.row},${c.position.col}`),
      );
      const blocked = board
        .arrowIds()
        .filter((id) => !traversal.canEscape(board, board.headOfArrow(id), holes));
      expect(blocked.length).toBeGreaterThanOrEqual(1);
    });

    it('should_be_fully_solvable_when_loaded_from_the_repository', async () => {
      // Arrange: go through the repository, exactly as play does.
      const repo = new BundledLevelRepository(BUNDLED_LEVELS);
      const level = await repo.getById(16);

      // Act
      const stuck = remainingAfterGreedySolve(level.board);

      // Assert
      expect(stuck).toBe(0);
    });
  });
});
