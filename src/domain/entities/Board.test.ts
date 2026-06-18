import { Board } from './Board';
import { ArrowCell } from './ArrowCell';
import { EmptyCell } from './EmptyCell';
import { Position } from '../value-objects/Position';
import { Direction } from '../value-objects/Direction';
import {
  EmptyBoardError,
  MisplacedCellError,
  NonRectangularBoardError,
  OutOfBoundsError,
} from '../errors';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';

describe('Board', () => {
  it('should_throw_EmptyBoardError_when_grid_has_no_cells', () => {
    expect(() => new Board([])).toThrow(EmptyBoardError);
  });

  it('should_throw_NonRectangularBoardError_when_rows_have_different_lengths', () => {
    // Arrange: row 0 has 2 cells, row 1 has 1 cell
    const grid = [
      [new EmptyCell(new Position(0, 0)), new EmptyCell(new Position(0, 1))],
      [new EmptyCell(new Position(1, 0))],
    ];

    // Act / Assert
    expect(() => new Board(grid)).toThrow(NonRectangularBoardError);
  });

  it('should_throw_MisplacedCellError_when_a_cell_position_does_not_match_its_coordinates', () => {
    // Arrange: cell at grid[0][0] claims to be at (5, 5)
    const grid = [[new EmptyCell(new Position(5, 5))]];

    // Act / Assert
    expect(() => new Board(grid)).toThrow(MisplacedCellError);
  });

  it('should_return_the_cell_when_querying_a_position_in_bounds', () => {
    // Arrange
    const board = buildBoard([[arrow('UP'), empty()]]);

    // Act
    const cell = board.cellAt(new Position(0, 0));

    // Assert
    expect(cell).toBeInstanceOf(ArrowCell);
  });

  it('should_throw_OutOfBoundsError_when_querying_a_position_outside_the_board', () => {
    // Arrange
    const board = buildBoard([[empty()]]);

    // Act / Assert
    expect(() => board.cellAt(new Position(9, 9))).toThrow(OutOfBoundsError);
  });

  it('should_leave_an_empty_cell_when_clearing_a_position', () => {
    // Arrange
    const board = buildBoard([[arrow('UP')]]);

    // Act
    board.clearCell(new Position(0, 0));

    // Assert
    expect(board.cellAt(new Position(0, 0))).toBeInstanceOf(EmptyCell);
  });

  it('should_count_only_arrow_cells_when_reporting_arrowCount', () => {
    // Arrange
    const board = buildBoard([
      [arrow('UP'), empty()],
      [arrow(Direction.LEFT.name), empty()],
    ]);

    // Act / Assert
    expect(board.arrowCount()).toBe(2);
    expect(board.isCleared()).toBe(false);
  });

  it('should_report_cleared_when_no_arrows_remain', () => {
    // Arrange
    const board = buildBoard([[empty(), empty()]]);

    // Act / Assert
    expect(board.isCleared()).toBe(true);
  });
});
