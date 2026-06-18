import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';

/** A solid wall: blocks sliding arrows and cannot be tapped. */
export class WallCell extends Cell {
  readonly kind: CellKind = 'WALL';

  constructor(position: Position) {
    super(position);
  }

  isPassable(): boolean {
    return false;
  }
}
