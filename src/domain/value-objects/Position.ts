import type { Direction } from './Direction';

/**
 * Immutable (row, col) coordinate on the board.
 */
export class Position {
  constructor(
    public readonly row: number,
    public readonly col: number,
  ) {}

  /** Returns a new position one step away in the given direction. */
  translate(direction: Direction): Position {
    return new Position(this.row + direction.rowDelta, this.col + direction.colDelta);
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  toString(): string {
    return `(${this.row}, ${this.col})`;
  }
}
