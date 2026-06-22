import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';
import type { Direction } from '../value-objects/Direction';

/**
 * A cell that belongs to an arrow. An arrow can span several contiguous cells
 * (its length); all cells of the same arrow share the same `arrowId`, `direction`
 * and `color`. A single-cell arrow is just the length-1 case.
 */
export class ArrowCell extends Cell {
  readonly kind: CellKind = 'ARROW';

  constructor(
    position: Position,
    public readonly direction: Direction,
    public readonly arrowId: number,
    public readonly color: string = '#6FE3C4',
  ) {
    super(position);
  }

  isPassable(): boolean {
    return false;
  }
}
