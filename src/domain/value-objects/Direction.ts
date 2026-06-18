import { InvalidDirectionError } from '../errors';

export type DirectionName = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Immutable value object representing one of the four arrow directions.
 *
 * Each direction carries the (row, col) delta used to walk across the board.
 * The board uses screen coordinates: row 0 is the top, col 0 is the left,
 * so UP decreases the row and LEFT decreases the column.
 */
export class Direction {
  static readonly UP = new Direction('UP', -1, 0);
  static readonly DOWN = new Direction('DOWN', 1, 0);
  static readonly LEFT = new Direction('LEFT', 0, -1);
  static readonly RIGHT = new Direction('RIGHT', 0, 1);

  private static readonly BY_NAME: Record<DirectionName, Direction> = {
    UP: Direction.UP,
    DOWN: Direction.DOWN,
    LEFT: Direction.LEFT,
    RIGHT: Direction.RIGHT,
  };

  private constructor(
    public readonly name: DirectionName,
    public readonly rowDelta: number,
    public readonly colDelta: number,
  ) {}

  static all(): Direction[] {
    return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  }

  static fromName(name: string): Direction {
    const direction = (Direction.BY_NAME as Record<string, Direction | undefined>)[name];
    if (!direction) {
      throw new InvalidDirectionError(name);
    }
    return direction;
  }

  equals(other: Direction): boolean {
    return this.name === other.name;
  }

  toString(): string {
    return this.name;
  }
}
