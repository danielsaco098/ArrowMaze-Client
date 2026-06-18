import { Direction } from './Direction';
import { InvalidDirectionError } from '../errors';

describe('Direction', () => {
  it('should_expose_correct_row_and_col_deltas_when_using_screen_coordinates', () => {
    // Arrange / Act / Assert
    expect([Direction.UP.rowDelta, Direction.UP.colDelta]).toEqual([-1, 0]);
    expect([Direction.DOWN.rowDelta, Direction.DOWN.colDelta]).toEqual([1, 0]);
    expect([Direction.LEFT.rowDelta, Direction.LEFT.colDelta]).toEqual([0, -1]);
    expect([Direction.RIGHT.rowDelta, Direction.RIGHT.colDelta]).toEqual([0, 1]);
  });

  it('should_return_matching_instance_when_resolving_a_valid_name', () => {
    // Arrange
    const name = 'LEFT';

    // Act
    const direction = Direction.fromName(name);

    // Assert
    expect(direction).toBe(Direction.LEFT);
  });

  it('should_throw_InvalidDirectionError_when_name_is_unknown', () => {
    // Arrange
    const name = 'DIAGONAL';

    // Act / Assert
    expect(() => Direction.fromName(name)).toThrow(InvalidDirectionError);
  });

  it('should_be_equal_when_names_match', () => {
    // Arrange / Act / Assert
    expect(Direction.UP.equals(Direction.fromName('UP'))).toBe(true);
    expect(Direction.UP.equals(Direction.DOWN)).toBe(false);
  });

  it('should_list_all_four_directions_when_calling_all', () => {
    // Act
    const all = Direction.all();

    // Assert
    expect(all).toHaveLength(4);
    expect(all.map((d) => d.name).sort()).toEqual(['DOWN', 'LEFT', 'RIGHT', 'UP']);
  });
});
