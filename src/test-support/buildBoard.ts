import { Board } from '../domain/entities/Board';
import { Position } from '../domain/value-objects/Position';
import { JsonCellFactory } from '../adapters/factories/JsonCellFactory';
import type { CellSpec } from '../application/ports/ICellFactory';
import type { DirectionName } from '../domain/value-objects/Direction';

const factory = new JsonCellFactory();

/** Builds a Board from a 2D grid of cell specs, assigning row/col positions automatically. */
export function buildBoard(specs: CellSpec[][]): Board {
  const grid = specs.map((row, r) => row.map((spec, c) => factory.create(spec, new Position(r, c))));
  return new Board(grid);
}

export const arrow = (
  direction: DirectionName,
  opts: { arrowId?: number; color?: string } = {},
): CellSpec => ({ kind: 'ARROW', direction, ...opts });
export const empty = (): CellSpec => ({ kind: 'EMPTY' });
export const wall = (): CellSpec => ({ kind: 'WALL' });
export const exit = (): CellSpec => ({ kind: 'EXIT' });
