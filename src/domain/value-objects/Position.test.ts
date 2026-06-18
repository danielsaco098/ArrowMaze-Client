import { Position } from './Position';
import { Direction } from './Direction';

describe('Position', () => {
  it('should_move_one_step_up_when_translated_with_UP', () => {
    // Arrange
    const start = new Position(2, 2);

    // Act
    const result = start.translate(Direction.UP);

    // Assert
    expect(result).toEqual(new Position(1, 2));
  });

  it('should_move_one_step_right_when_translated_with_RIGHT', () => {
    // Arrange
    const start = new Position(2, 2);

    // Act
    const result = start.translate(Direction.RIGHT);

    // Assert
    expect(result).toEqual(new Position(2, 3));
  });

  it('should_not_mutate_the_original_position_when_translated', () => {
    // Arrange
    const start = new Position(2, 2);

    // Act
    start.translate(Direction.DOWN);

    // Assert
    expect(start).toEqual(new Position(2, 2));
  });

  it('should_be_equal_when_row_and_col_match', () => {
    // Arrange / Act / Assert
    expect(new Position(1, 4).equals(new Position(1, 4))).toBe(true);
    expect(new Position(1, 4).equals(new Position(4, 1))).toBe(false);
  });
});
