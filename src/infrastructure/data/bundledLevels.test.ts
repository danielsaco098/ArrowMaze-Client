import { BUNDLED_LEVELS } from './bundledLevels';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';
import { Board } from '../../domain/entities/Board';
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
      if (cell.isArrow() && traversal.canEscape(board, cell.position)) {
        board.clearCell(cell.position);
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
});
