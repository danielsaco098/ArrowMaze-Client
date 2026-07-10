import { Cell } from './Cell';
import { ArrowCell } from './ArrowCell';
import { EmptyCell } from './EmptyCell';
import { Position } from '../value-objects/Position';
import {
  EmptyBoardError,
  MisplacedCellError,
  NonRectangularBoardError,
  OutOfBoundsError,
  UnknownArrowError,
} from '../errors';

/**
 * The game board: a rectangular grid of cells.
 *
 * Acts as the Composite root over individual `Cell`s, exposing uniform queries
 * (`cellAt`, `cells`) regardless of concrete cell type. The grid is encapsulated;
 * callers mutate it only through the intent-revealing methods below.
 */
export class Board {
  private readonly grid: Cell[][];
  readonly rows: number;
  readonly cols: number;

  constructor(grid: Cell[][]) {
    if (grid.length === 0 || grid[0].length === 0) {
      throw new EmptyBoardError();
    }
    this.rows = grid.length;
    this.cols = grid[0].length;

    for (let row = 0; row < this.rows; row += 1) {
      if (grid[row].length !== this.cols) {
        throw new NonRectangularBoardError();
      }
      for (let col = 0; col < this.cols; col += 1) {
        const cell = grid[row][col];
        if (cell.position.row !== row || cell.position.col !== col) {
          throw new MisplacedCellError(row, col);
        }
      }
    }

    // Defensive copy so external references cannot mutate the grid structure.
    this.grid = grid.map((row) => [...row]);
  }

  isWithinBounds(position: Position): boolean {
    return (
      position.row >= 0 &&
      position.row < this.rows &&
      position.col >= 0 &&
      position.col < this.cols
    );
  }

  cellAt(position: Position): Cell {
    if (!this.isWithinBounds(position)) {
      throw new OutOfBoundsError(position);
    }
    return this.grid[position.row][position.col];
  }

  /** Replaces the cell at `cell.position`. */
  replaceCell(cell: Cell): void {
    if (!this.isWithinBounds(cell.position)) {
      throw new OutOfBoundsError(cell.position);
    }
    this.grid[cell.position.row][cell.position.col] = cell;
  }

  /** Removes whatever is at `position`, leaving an empty cell (an arrow that escaped). */
  clearCell(position: Position): void {
    this.replaceCell(new EmptyCell(position));
  }

  /** All cells in row-major order. */
  cells(): Cell[] {
    return this.grid.flat();
  }

  /** The cells that make up a given arrow (one or more, contiguous). */
  private arrowCellsOf(arrowId: number): ArrowCell[] {
    return this.cells().filter(
      (cell): cell is ArrowCell => cell instanceof ArrowCell && cell.arrowId === arrowId,
    );
  }

  /** The distinct arrow ids currently on the board. */
  arrowIds(): number[] {
    const ids = new Set<number>();
    for (const cell of this.cells()) {
      if (cell instanceof ArrowCell) {
        ids.add(cell.arrowId);
      }
    }
    return [...ids];
  }

  /**
   * The ordered path of an arrow, tail first, head last. Ordered by
   * `segmentIndex`; straight legacy arrows without segment order fall back to
   * ordering along their (shared) pointing direction.
   */
  pathOfArrow(arrowId: number): ArrowCell[] {
    const cells = this.arrowCellsOf(arrowId);
    if (cells.length === 0) {
      throw new UnknownArrowError(arrowId);
    }
    if (cells.some((cell) => cell.segmentIndex > 0)) {
      return [...cells].sort((a, b) => a.segmentIndex - b.segmentIndex);
    }
    const direction = cells[0].direction;
    const projection = (p: Position): number => p.row * direction.rowDelta + p.col * direction.colDelta;
    return [...cells].sort((a, b) => projection(a.position) - projection(b.position));
  }

  /** The leading cell of an arrow: the last segment of its path. */
  headOfArrow(arrowId: number): Position {
    return this.headCellOfArrow(arrowId).position;
  }

  /** The head as a cell, so callers can also read its exit direction. */
  headCellOfArrow(arrowId: number): ArrowCell {
    const path = this.pathOfArrow(arrowId);
    return path[path.length - 1];
  }

  /** Removes an entire arrow (all its cells become empty) when it escapes. */
  clearArrow(arrowId: number): void {
    for (const cell of this.arrowCellsOf(arrowId)) {
      this.clearCell(cell.position);
    }
  }

  /** Number of arrows remaining (counts whole arrows, not individual cells). */
  arrowCount(): number {
    return this.arrowIds().length;
  }

  isCleared(): boolean {
    return this.arrowCount() === 0;
  }
}
