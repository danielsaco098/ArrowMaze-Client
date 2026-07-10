import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';
import type { Direction } from '../value-objects/Direction';

/**
 * A cell that belongs to an arrow. An arrow is a path of contiguous cells (it
 * may snake and turn); all cells of the same arrow share the `arrowId` and
 * `color`. Each cell's `direction` points to the NEXT segment of the path, and
 * the head cell's direction is where the whole arrow exits. `segmentIndex`
 * orders the path (0 = tail, highest = head). A single straight, single-cell
 * arrow is just the trivial case.
 */
export class ArrowCell extends Cell {
  readonly kind: CellKind = 'ARROW';

  constructor(
    position: Position,
    public readonly direction: Direction,
    public readonly arrowId: number,
    public readonly color: string = '#6FE3C4',
    public readonly segmentIndex: number = 0,
  ) {
    super(position);
  }

  isPassable(): boolean {
    return false;
  }
}
