import { generateLevel, LevelConfig } from './levelGenerator';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { PathTraversalService } from '../../domain/services/PathTraversalService';
import { Board } from '../../domain/entities/Board';

const builder = new JsonLevelBuilder();
const traversal = new PathTraversalService();

function isSolvable(board: Board): boolean {
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
  return board.arrowCount() === 0;
}

const config: LevelConfig = {
  id: 1,
  name: 'Test',
  difficulty: 'MEDIUM',
  rows: 6,
  cols: 6,
  seed: 12345,
  maxLength: 3,
};

describe('generateLevel', () => {
  it('should_be_deterministic_for_the_same_seed', () => {
    expect(generateLevel(config)).toEqual(generateLevel(config));
  });

  it('should_produce_different_layouts_for_different_seeds', () => {
    const a = generateLevel(config);
    const b = generateLevel({ ...config, seed: 999 });
    expect(a.cells).not.toEqual(b.cells);
  });

  it('should_always_produce_a_solvable_board_across_many_seeds', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const board = builder.build(generateLevel({ ...config, seed })).board;
      expect(isSolvable(board)).toBe(true);
    }
  });
});
