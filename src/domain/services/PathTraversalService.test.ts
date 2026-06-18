import { PathTraversalService } from './PathTraversalService';
import { Position } from '../value-objects/Position';
import { NotAnArrowError } from '../errors';
import { arrow, buildBoard, empty, exit, wall } from '../../test-support/buildBoard';

describe('PathTraversalService', () => {
  const service = new PathTraversalService();

  it('should_return_true_when_path_to_the_edge_is_clear', () => {
    // Arrange: arrow at the bottom pointing UP through two empty cells
    const board = buildBoard([[empty()], [empty()], [arrow('UP')]]);

    // Act
    const canEscape = service.canEscape(board, new Position(2, 0));

    // Assert
    expect(canEscape).toBe(true);
  });

  it('should_return_false_when_another_arrow_blocks_the_path', () => {
    // Arrange: bottom arrow points UP but a downward arrow sits at the top
    const board = buildBoard([[arrow('DOWN')], [empty()], [arrow('UP')]]);

    // Act
    const canEscape = service.canEscape(board, new Position(2, 0));

    // Assert
    expect(canEscape).toBe(false);
  });

  it('should_return_false_when_a_wall_blocks_the_path', () => {
    // Arrange
    const board = buildBoard([[wall()], [empty()], [arrow('UP')]]);

    // Act / Assert
    expect(service.canEscape(board, new Position(2, 0))).toBe(false);
  });

  it('should_return_true_when_path_only_crosses_empty_and_exit_cells', () => {
    // Arrange: arrow RIGHT passes an exit cell then leaves the board
    const board = buildBoard([[arrow('RIGHT'), exit(), empty()]]);

    // Act / Assert
    expect(service.canEscape(board, new Position(0, 0))).toBe(true);
  });

  it('should_throw_NotAnArrowError_when_target_cell_is_not_an_arrow', () => {
    // Arrange
    const board = buildBoard([[empty()]]);

    // Act / Assert
    expect(() => service.canEscape(board, new Position(0, 0))).toThrow(NotAnArrowError);
  });

  it('should_include_the_off_board_exit_point_when_computing_pathToEdge', () => {
    // Arrange: arrow RIGHT on a 1x2 board
    const board = buildBoard([[arrow('RIGHT'), empty()]]);

    // Act
    const path = service.pathToEdge(board, new Position(0, 0));

    // Assert: one in-bounds step then the off-board exit cell
    expect(path).toEqual([new Position(0, 1), new Position(0, 2)]);
  });
});
