import { Cell, CellKind } from './Cell';
import type { Position } from '../value-objects/Position';

/**
 * A star sitting on an otherwise empty cell. Arrows slide straight over it
 * (passable); when an escaping arrow sweeps across it, the star is collected
 * and awards bonus points.
 */
export class CollectibleCell extends Cell {
  readonly kind: CellKind = 'COLLECTIBLE';

  constructor(position: Position) {
    super(position);
  }

  isPassable(): boolean {
    return true;
  }
}
