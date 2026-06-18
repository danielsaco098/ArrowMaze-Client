import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';
import type { Direction } from '../value-objects/Direction';

/** A cell holding an arrow that points in a fixed direction. */
export class ArrowCell extends Cell {
  readonly kind: CellKind = 'ARROW';

  constructor(
    position: Position,
    public readonly direction: Direction,
  ) {
    super(position);
  }

  isPassable(): boolean {
    return false;
  }
}
