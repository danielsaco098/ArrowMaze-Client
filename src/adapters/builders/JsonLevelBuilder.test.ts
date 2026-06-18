import { JsonLevelBuilder, MalformedLevelDataError } from './JsonLevelBuilder';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { WallCell } from '../../domain/entities/WallCell';
import { EmptyCell } from '../../domain/entities/EmptyCell';
import { ExitCell } from '../../domain/entities/ExitCell';
import { Direction } from '../../domain/value-objects/Direction';
import { Position } from '../../domain/value-objects/Position';
import type { LevelData } from '../../application/ports/ILevelBuilder';

describe('JsonLevelBuilder', () => {
  const builder = new JsonLevelBuilder();

  const sampleData: LevelData = {
    id: 1,
    name: 'First Steps',
    difficulty: 'EASY',
    rows: 2,
    cols: 3,
    cells: [
      { row: 0, col: 0, kind: 'ARROW', direction: 'RIGHT' },
      { row: 1, col: 2, kind: 'WALL' },
      { row: 0, col: 2, kind: 'EXIT' },
    ],
  };

  it('should_build_a_level_with_its_metadata_and_dimensions', () => {
    // Act
    const level = builder.build(sampleData);

    // Assert
    expect(level.id).toBe(1);
    expect(level.name).toBe('First Steps');
    expect(level.difficulty).toBe('EASY');
    expect(level.board.rows).toBe(2);
    expect(level.board.cols).toBe(3);
  });

  it('should_place_each_defined_cell_at_its_position', () => {
    // Act
    const board = builder.build(sampleData).board;

    // Assert
    const arrow = board.cellAt(new Position(0, 0));
    expect(arrow).toBeInstanceOf(ArrowCell);
    expect((arrow as ArrowCell).direction).toBe(Direction.RIGHT);
    expect(board.cellAt(new Position(1, 2))).toBeInstanceOf(WallCell);
    expect(board.cellAt(new Position(0, 2))).toBeInstanceOf(ExitCell);
  });

  it('should_default_unlisted_positions_to_empty_cells', () => {
    // Act
    const board = builder.build(sampleData).board;

    // Assert
    expect(board.cellAt(new Position(0, 1))).toBeInstanceOf(EmptyCell);
    expect(board.cellAt(new Position(1, 0))).toBeInstanceOf(EmptyCell);
  });

  it('should_count_only_the_defined_arrows_on_the_built_board', () => {
    // Act / Assert
    expect(builder.build(sampleData).board.arrowCount()).toBe(1);
  });

  it('should_throw_MalformedLevelDataError_when_dimensions_are_not_positive', () => {
    expect(() => builder.build({ ...sampleData, rows: 0 })).toThrow(MalformedLevelDataError);
  });

  it('should_throw_MalformedLevelDataError_when_a_cell_is_out_of_bounds', () => {
    // Arrange
    const data: LevelData = {
      ...sampleData,
      cells: [{ row: 5, col: 5, kind: 'ARROW', direction: 'UP' }],
    };

    // Act / Assert
    expect(() => builder.build(data)).toThrow(MalformedLevelDataError);
  });
});
