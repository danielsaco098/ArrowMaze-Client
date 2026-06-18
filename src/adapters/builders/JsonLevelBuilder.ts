import { Board } from '../../domain/entities/Board';
import { Cell } from '../../domain/entities/Cell';
import { Level } from '../../domain/entities/Level';
import { Position } from '../../domain/value-objects/Position';
import { JsonCellFactory } from '../factories/JsonCellFactory';
import type { ICellFactory } from '../../application/ports/ICellFactory';
import type { CellData, ILevelBuilder, LevelData } from '../../application/ports/ILevelBuilder';

/** Raised when a level definition is structurally invalid. */
export class MalformedLevelDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedLevelDataError';
  }
}

/**
 * Builder: assembles a {@link Level} step by step from a {@link LevelData}
 * definition —
 *   1. lay out an empty grid of the requested size,
 *   2. place each defined cell on top,
 *   3. wrap the grid in a Board,
 *   4. tag it with the level metadata.
 *
 * Delegates the "which concrete cell" decision to an {@link ICellFactory}
 * (Factory Method), so the builder focuses purely on assembly.
 */
export class JsonLevelBuilder implements ILevelBuilder {
  constructor(private readonly cellFactory: ICellFactory = new JsonCellFactory()) {}

  build(data: LevelData): Level {
    if (data.rows <= 0 || data.cols <= 0) {
      throw new MalformedLevelDataError(`Level ${data.id} must have positive dimensions.`);
    }

    const grid = this.createEmptyGrid(data.rows, data.cols);
    this.placeCells(grid, data.cells, data.rows, data.cols);

    const board = new Board(grid);
    return new Level(data.id, data.name, data.difficulty, board);
  }

  private createEmptyGrid(rows: number, cols: number): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < rows; row += 1) {
      const cells: Cell[] = [];
      for (let col = 0; col < cols; col += 1) {
        cells.push(this.cellFactory.create({ kind: 'EMPTY' }, new Position(row, col)));
      }
      grid.push(cells);
    }
    return grid;
  }

  private placeCells(
    grid: Cell[][],
    cells: ReadonlyArray<CellData>,
    rows: number,
    cols: number,
  ): void {
    for (const cell of cells) {
      if (cell.row < 0 || cell.row >= rows || cell.col < 0 || cell.col >= cols) {
        throw new MalformedLevelDataError(
          `Cell at (${cell.row}, ${cell.col}) is outside the ${rows}x${cols} board.`,
        );
      }
      const position = new Position(cell.row, cell.col);
      grid[cell.row][cell.col] = this.cellFactory.create(
        { kind: cell.kind, direction: cell.direction },
        position,
      );
    }
  }
}
