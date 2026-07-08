import { BUNDLED_LEVELS } from './bundledLevels';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';
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

describe('bundled levels', () => {
  it('should_bundle_15_levels_with_unique_sequential_ids', () => {
    // Assert
    expect(BUNDLED_LEVELS).toHaveLength(15);
    expect(BUNDLED_LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('should_group_difficulty_progressively_from_easy_to_hard', () => {
    // Assert
    const difficulties = BUNDLED_LEVELS.map((l) => l.difficulty);
    expect(difficulties.slice(0, 5)).toEqual(Array(5).fill('EASY'));
    expect(difficulties.slice(5, 10)).toEqual(Array(5).fill('MEDIUM'));
    expect(difficulties.slice(10, 15)).toEqual(Array(5).fill('HARD'));
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

  it('should_densely_fill_every_board', () => {
    for (const level of BUNDLED_LEVELS) {
      const occupied = level.cells.filter(
        (c) => c.kind === 'ARROW' || c.kind === 'WALL' || c.kind === 'COLLECTIBLE',
      ).length;
      const fill = occupied / (level.rows * level.cols);
      expect(fill).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('should_place_collectible_stars_in_medium_and_hard_levels_only', () => {
    for (const level of BUNDLED_LEVELS) {
      const stars = level.cells.filter((c) => c.kind === 'COLLECTIBLE').length;
      if (level.difficulty === 'EASY') {
        expect(stars).toBe(0);
      } else {
        expect(stars).toBeGreaterThan(0);
      }
    }
  });

  it('should_set_a_time_limit_on_hard_levels_only', () => {
    for (const level of BUNDLED_LEVELS) {
      if (level.difficulty === 'HARD') {
        expect(level.timeLimitSeconds).toBeGreaterThan(0);
      } else {
        expect(level.timeLimitSeconds).toBeUndefined();
      }
    }
  });

  it('should_include_walls_in_medium_and_hard_levels_only', () => {
    for (const level of BUNDLED_LEVELS) {
      const walls = level.cells.filter((c) => c.kind === 'WALL').length;
      if (level.difficulty === 'EASY') {
        expect(walls).toBe(0);
      } else {
        expect(walls).toBeGreaterThan(0);
      }
    }
  });

  it('should_use_multi_cell_arrows_in_medium_and_hard_levels', () => {
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
});
