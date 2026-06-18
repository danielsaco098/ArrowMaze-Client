import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';

/** An empty cell: passable, nothing to tap. Also what an arrow leaves behind when it escapes. */
export class EmptyCell extends Cell {
  readonly kind: CellKind = 'EMPTY';

  constructor(position: Position) {
    super(position);
  }

  isPassable(): boolean {
    return true;
  }
}
