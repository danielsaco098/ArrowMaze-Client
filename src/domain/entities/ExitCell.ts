import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';

/**
 * An explicit exit marker. Passable like an empty cell, but kept as a distinct
 * type so levels can highlight designated exits and future rules can treat them
 * specially without changing the traversal logic (Open/Closed).
 */
export class ExitCell extends Cell {
  readonly kind: CellKind = 'EXIT';

  constructor(position: Position) {
    super(position);
  }

  isPassable(): boolean {
    return true;
  }
}
