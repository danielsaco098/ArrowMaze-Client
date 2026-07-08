import type { Position } from '../value-objects/Position';

export type CellKind = 'ARROW' | 'WALL' | 'EMPTY' | 'EXIT' | 'COLLECTIBLE';

/**
 * Abstract base for every cell on the board.
 *
 * Subclasses (ArrowCell, WallCell, EmptyCell, ExitCell, CollectibleCell) are
 * fully interchangeable wherever a `Cell` is expected (Liskov Substitution): the
 * traversal logic only relies on the polymorphic {@link isPassable} method,
 * never on a concrete type.
 */
export abstract class Cell {
  protected constructor(public readonly position: Position) {}

  abstract readonly kind: CellKind;

  /**
   * Can a sliding arrow pass through this cell on its way off the board?
   * Empty and exit cells are passable; arrows and walls block the path.
   */
  abstract isPassable(): boolean;

  /** Is this a tappable arrow cell? */
  isArrow(): boolean {
    return this.kind === 'ARROW';
  }
}
