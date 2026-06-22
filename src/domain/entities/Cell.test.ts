import { ArrowCell } from './ArrowCell';
import { WallCell } from './WallCell';
import { EmptyCell } from './EmptyCell';
import { ExitCell } from './ExitCell';
import { Position } from '../value-objects/Position';
import { Direction } from '../value-objects/Direction';

const at = new Position(0, 0);

describe('Cell hierarchy', () => {
  it('should_block_traversal_when_cell_is_an_arrow_or_a_wall', () => {
    expect(new ArrowCell(at, Direction.UP, 1).isPassable()).toBe(false);
    expect(new WallCell(at).isPassable()).toBe(false);
  });

  it('should_allow_traversal_when_cell_is_empty_or_exit', () => {
    expect(new EmptyCell(at).isPassable()).toBe(true);
    expect(new ExitCell(at).isPassable()).toBe(true);
  });

  it('should_identify_only_arrow_cells_as_tappable', () => {
    expect(new ArrowCell(at, Direction.UP, 1).isArrow()).toBe(true);
    expect(new WallCell(at).isArrow()).toBe(false);
    expect(new EmptyCell(at).isArrow()).toBe(false);
    expect(new ExitCell(at).isArrow()).toBe(false);
  });

  it('should_expose_its_kind_and_direction_when_cell_is_an_arrow', () => {
    // Arrange
    const cell = new ArrowCell(at, Direction.RIGHT, 1);

    // Assert
    expect(cell.kind).toBe('ARROW');
    expect(cell.direction).toBe(Direction.RIGHT);
  });
});
